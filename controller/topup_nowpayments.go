package controller

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha512"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/logger"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/setting"
	"github.com/QuantumNous/new-api/setting/operation_setting"
	"github.com/QuantumNous/new-api/setting/system_setting"
	"github.com/gin-gonic/gin"
	"github.com/shopspring/decimal"
	"github.com/thanhpk/randstr"
)

const nowPaymentsAPIBaseURL = "https://api.nowpayments.io/v1"
const nowPaymentsSignatureHeader = "x-nowpayments-sig"

type NowPaymentsPayRequest struct {
	Amount        int64  `json:"amount"`
	PaymentMethod string `json:"payment_method"`
}

type nowPaymentsInvoiceRequest struct {
	PriceAmount      string `json:"price_amount"`
	PriceCurrency    string `json:"price_currency"`
	OrderID          string `json:"order_id"`
	OrderDescription string `json:"order_description"`
	IPNCallbackURL   string `json:"ipn_callback_url"`
	SuccessURL       string `json:"success_url"`
	CancelURL        string `json:"cancel_url"`
	IsFixedRate      bool   `json:"is_fixed_rate"`
	IsFeePaidByUser  bool   `json:"is_fee_paid_by_user"`
}

type nowPaymentsInvoiceResponse struct {
	ID         string `json:"id"`
	InvoiceURL string `json:"invoice_url"`
	OrderID    string `json:"order_id"`
}

type nowPaymentsWebhookPayload struct {
	PaymentID     any     `json:"payment_id"`
	PaymentStatus string  `json:"payment_status"`
	PayAddress    string  `json:"pay_address"`
	PriceAmount   float64 `json:"price_amount"`
	PriceCurrency string  `json:"price_currency"`
	PayAmount     float64 `json:"pay_amount"`
	PayCurrency   string  `json:"pay_currency"`
	OrderID       string  `json:"order_id"`
}

func RequestNowPaymentsAmount(c *gin.Context) {
	var req NowPaymentsPayRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "Parameter error"})
		return
	}

	if req.Amount < getNowPaymentsMinTopup() {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": fmt.Sprintf("The recharge amount cannot be less than %d", getNowPaymentsMinTopup())})
		return
	}

	id := c.GetInt("id")
	group, err := model.GetUserGroup(id, true)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "Failed to obtain user group"})
		return
	}

	payMoney := getNowPaymentsPayMoney(req.Amount, group)
	if payMoney <= 0.01 {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "Recharge amount is too low"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "success", "data": strconv.FormatFloat(payMoney, 'f', 2, 64)})
}

func RequestNowPaymentsPay(c *gin.Context) {
	var req NowPaymentsPayRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "Parameter error"})
		return
	}

	if req.PaymentMethod != model.PaymentMethodNowPayments {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "Unsupported payment channels"})
		return
	}
	if !isNowPaymentsTopUpEnabled() {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "Crypto payment is not configured"})
		return
	}
	if req.Amount < getNowPaymentsMinTopup() {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": fmt.Sprintf("The recharge amount cannot be less than %d", getNowPaymentsMinTopup())})
		return
	}
	if req.Amount > 10000 {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "The recharge amount cannot be greater than 10,000"})
		return
	}
	if !hasValidPaymentReturnAddress() {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "ServerAddress must be a public http:// or https:// URL before crypto checkout can be created"})
		return
	}

	id := c.GetInt("id")
	user, _ := model.GetUserById(id, false)
	if user == nil {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "User does not exist"})
		return
	}

	payMoney := getNowPaymentsPayMoney(req.Amount, user.Group)
	if payMoney <= 0.01 {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "Recharge amount is too low"})
		return
	}

	reference := fmt.Sprintf("nowpayments-ref-%d-%d-%s", user.Id, time.Now().UnixMilli(), randstr.String(4))
	referenceId := "ref_" + common.Sha1([]byte(reference))

	topUp := &model.TopUp{
		UserId:          id,
		Amount:          req.Amount,
		Money:           payMoney,
		TradeNo:         referenceId,
		PaymentMethod:   model.PaymentMethodNowPayments,
		PaymentProvider: model.PaymentProviderNowPayments,
		CreateTime:      time.Now().Unix(),
		Status:          common.TopUpStatusPending,
	}
	if err := topUp.Insert(); err != nil {
		logger.LogError(c.Request.Context(), fmt.Sprintf("NOWPayments failed to create recharge order user_id=%d trade_no=%s amount=%d error=%q", id, referenceId, req.Amount, err.Error()))
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "Failed to create order"})
		return
	}

	invoiceURL, err := genNowPaymentsInvoice(c.Request.Context(), referenceId, payMoney)
	if err != nil {
		logger.LogError(c.Request.Context(), fmt.Sprintf("NOWPayments invoice creation failed user_id=%d trade_no=%s amount=%d error=%q", id, referenceId, req.Amount, err.Error()))
		topUp.Status = common.TopUpStatusFailed
		_ = topUp.Update()
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": getNowPaymentsCheckoutErrorMessage(err)})
		return
	}

	logger.LogInfo(c.Request.Context(), fmt.Sprintf("NOWPayments recharge order created successfully user_id=%d trade_no=%s amount=%d money=%.2f", id, referenceId, req.Amount, payMoney))
	c.JSON(http.StatusOK, gin.H{
		"message": "success",
		"data": gin.H{
			"invoice_url": invoiceURL,
			"order_id":    referenceId,
		},
	})
}

func NowPaymentsWebhook(c *gin.Context) {
	if !isNowPaymentsWebhookEnabled() {
		logger.LogWarn(c.Request.Context(), fmt.Sprintf("NOWPayments webhook rejected reason=webhook_disabled path=%q client_ip=%s", c.Request.RequestURI, c.ClientIP()))
		c.AbortWithStatus(http.StatusForbidden)
		return
	}

	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		logger.LogError(c.Request.Context(), fmt.Sprintf("NOWPayments webhook failed to read request body path=%q client_ip=%s error=%q", c.Request.RequestURI, c.ClientIP(), err.Error()))
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}

	signature := c.GetHeader(nowPaymentsSignatureHeader)
	if signature == "" {
		logger.LogWarn(c.Request.Context(), fmt.Sprintf("NOWPayments webhook missing signature path=%q client_ip=%s body=%q", c.Request.RequestURI, c.ClientIP(), string(body)))
		c.AbortWithStatus(http.StatusUnauthorized)
		return
	}

	if !verifyNowPaymentsSignature(body, signature, setting.NowPaymentsIpnSecret) {
		logger.LogWarn(c.Request.Context(), fmt.Sprintf("NOWPayments webhook signature verification failed path=%q client_ip=%s signature=%q body=%q", c.Request.RequestURI, c.ClientIP(), signature, string(body)))
		c.AbortWithStatus(http.StatusUnauthorized)
		return
	}

	var payload nowPaymentsWebhookPayload
	if err := common.Unmarshal(body, &payload); err != nil {
		logger.LogError(c.Request.Context(), fmt.Sprintf("NOWPayments webhook parsing failed path=%q client_ip=%s error=%q body=%q", c.Request.RequestURI, c.ClientIP(), err.Error(), string(body)))
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}

	referenceId := strings.TrimSpace(payload.OrderID)
	if referenceId == "" {
		logger.LogWarn(c.Request.Context(), fmt.Sprintf("NOWPayments webhook missing order_id status=%s payment_id=%v", payload.PaymentStatus, payload.PaymentID))
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}

	logger.LogInfo(c.Request.Context(), fmt.Sprintf("NOWPayments webhook received trade_no=%s payment_id=%v status=%s price_amount=%.2f price_currency=%s pay_amount=%.8f pay_currency=%s", referenceId, payload.PaymentID, payload.PaymentStatus, payload.PriceAmount, payload.PriceCurrency, payload.PayAmount, payload.PayCurrency))

	LockOrder(referenceId)
	defer UnlockOrder(referenceId)

	switch strings.ToLower(strings.TrimSpace(payload.PaymentStatus)) {
	case "finished":
		if err := model.RechargeNowPayments(referenceId, c.ClientIP()); err != nil {
			logger.LogError(c.Request.Context(), fmt.Sprintf("NOWPayments recharge processing failed trade_no=%s payment_id=%v client_ip=%s error=%q", referenceId, payload.PaymentID, c.ClientIP(), err.Error()))
			c.AbortWithStatus(http.StatusInternalServerError)
			return
		}
	case "failed", "expired", "refunded", "partially_paid", "cancelled", "wrong_asset_confirmed":
		err := model.UpdatePendingTopUpStatus(referenceId, model.PaymentProviderNowPayments, common.TopUpStatusFailed)
		if err != nil && !errorsIsTopUpAlreadyClosed(err) {
			logger.LogError(c.Request.Context(), fmt.Sprintf("NOWPayments failed to close recharge order trade_no=%s payment_id=%v status=%s error=%q", referenceId, payload.PaymentID, payload.PaymentStatus, err.Error()))
			c.AbortWithStatus(http.StatusInternalServerError)
			return
		}
	default:
		logger.LogInfo(c.Request.Context(), fmt.Sprintf("NOWPayments webhook status is not terminal, ignore trade_no=%s payment_id=%v status=%s", referenceId, payload.PaymentID, payload.PaymentStatus))
	}

	c.Status(http.StatusOK)
}

func genNowPaymentsInvoice(ctx context.Context, referenceId string, payMoney float64) (string, error) {
	if strings.TrimSpace(setting.NowPaymentsApiKey) == "" {
		return "", fmt.Errorf("NOWPayments API key is not configured")
	}

	payload := nowPaymentsInvoiceRequest{
		PriceAmount:      strconv.FormatFloat(payMoney, 'f', 2, 64),
		PriceCurrency:    "usd",
		OrderID:          referenceId,
		OrderDescription: common.SystemName + " wallet top-up",
		IPNCallbackURL:   strings.TrimRight(system_setting.ServerAddress, "/") + "/api/nowpayments/webhook",
		SuccessURL:       getWalletReturnURL(true),
		CancelURL:        getWalletReturnURL(false),
		IsFixedRate:      setting.NowPaymentsFixedRate,
		IsFeePaidByUser:  setting.NowPaymentsFeePaidByUser,
	}

	requestBody, err := common.Marshal(payload)
	if err != nil {
		return "", fmt.Errorf("failed to serialize NOWPayments invoice request: %w", err)
	}

	req, err := http.NewRequest(http.MethodPost, nowPaymentsAPIBaseURL+"/invoice", bytes.NewReader(requestBody))
	if err != nil {
		return "", fmt.Errorf("failed to create NOWPayments invoice request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", setting.NowPaymentsApiKey)

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to send NOWPayments invoice request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read NOWPayments invoice response: %w", err)
	}

	logger.LogInfo(ctx, fmt.Sprintf("NOWPayments invoice response received trade_no=%s status_code=%d body=%q", referenceId, resp.StatusCode, string(body)))
	if resp.StatusCode/100 != 2 {
		return "", fmt.Errorf("NOWPayments API http status %d body=%s", resp.StatusCode, string(body))
	}

	var invoiceResp nowPaymentsInvoiceResponse
	if err := common.Unmarshal(body, &invoiceResp); err != nil {
		return "", fmt.Errorf("failed to parse NOWPayments invoice response: %w", err)
	}
	if strings.TrimSpace(invoiceResp.InvoiceURL) == "" {
		return "", fmt.Errorf("NOWPayments invoice response did not include invoice_url")
	}

	return invoiceResp.InvoiceURL, nil
}

func getNowPaymentsPayMoney(amount int64, group string) float64 {
	dAmount := decimal.NewFromInt(amount)
	if operation_setting.GetQuotaDisplayType() == operation_setting.QuotaDisplayTypeTokens {
		dAmount = dAmount.Div(decimal.NewFromFloat(common.QuotaPerUnit))
	}

	topupGroupRatio := common.GetTopupGroupRatio(group)
	if topupGroupRatio == 0 {
		topupGroupRatio = 1
	}

	discount := 1.0
	if ds, ok := operation_setting.GetPaymentSetting().AmountDiscount[int(amount)]; ok && ds > 0 {
		discount = ds
	}

	return dAmount.
		Mul(decimal.NewFromFloat(setting.NowPaymentsUnitPrice)).
		Mul(decimal.NewFromFloat(topupGroupRatio)).
		Mul(decimal.NewFromFloat(discount)).
		InexactFloat64()
}

func getNowPaymentsMinTopup() int64 {
	minTopup := setting.NowPaymentsMinTopUp
	if operation_setting.GetQuotaDisplayType() == operation_setting.QuotaDisplayTypeTokens {
		minTopup = minTopup * int(common.QuotaPerUnit)
	}
	return int64(minTopup)
}

func verifyNowPaymentsSignature(body []byte, signature string, secret string) bool {
	expectedSignature, err := generateNowPaymentsSignature(body, secret)
	if err != nil {
		return false
	}
	return hmac.Equal([]byte(strings.ToLower(signature)), []byte(expectedSignature))
}

func generateNowPaymentsSignature(body []byte, secret string) (string, error) {
	if strings.TrimSpace(secret) == "" {
		return "", fmt.Errorf("NOWPayments IPN secret is not configured")
	}

	canonical, err := canonicalNowPaymentsJSON(body)
	if err != nil {
		return "", err
	}

	h := hmac.New(sha512.New, []byte(secret))
	h.Write([]byte(canonical))
	return hex.EncodeToString(h.Sum(nil)), nil
}

func canonicalNowPaymentsJSON(body []byte) (string, error) {
	var raw json.RawMessage
	if err := common.Unmarshal(body, &raw); err != nil {
		return "", err
	}
	return canonicalNowPaymentsValue(raw)
}

func canonicalNowPaymentsValue(raw json.RawMessage) (string, error) {
	trimmed := bytes.TrimSpace(raw)
	switch common.GetJsonType(trimmed) {
	case "object":
		var object map[string]json.RawMessage
		if err := common.Unmarshal(trimmed, &object); err != nil {
			return "", err
		}
		keys := make([]string, 0, len(object))
		for key := range object {
			keys = append(keys, key)
		}
		sort.Strings(keys)

		var b strings.Builder
		b.WriteByte('{')
		for i, key := range keys {
			if i > 0 {
				b.WriteByte(',')
			}
			keyJSON, err := common.Marshal(key)
			if err != nil {
				return "", err
			}
			valueJSON, err := canonicalNowPaymentsValue(object[key])
			if err != nil {
				return "", err
			}
			b.Write(keyJSON)
			b.WriteByte(':')
			b.WriteString(valueJSON)
		}
		b.WriteByte('}')
		return b.String(), nil
	case "array":
		var array []json.RawMessage
		if err := common.Unmarshal(trimmed, &array); err != nil {
			return "", err
		}
		values := make([]string, 0, len(array))
		for _, value := range array {
			canonical, err := canonicalNowPaymentsValue(value)
			if err != nil {
				return "", err
			}
			values = append(values, canonical)
		}
		return "[" + strings.Join(values, ",") + "]", nil
	case "string":
		var value string
		if err := common.Unmarshal(trimmed, &value); err != nil {
			return "", err
		}
		encoded, err := common.Marshal(value)
		if err != nil {
			return "", err
		}
		return string(encoded), nil
	case "number":
		var value float64
		if err := common.Unmarshal(trimmed, &value); err != nil {
			return "", err
		}
		encoded, err := common.Marshal(value)
		if err != nil {
			return "", err
		}
		return string(encoded), nil
	case "boolean", "null":
		return string(trimmed), nil
	default:
		return "", fmt.Errorf("unsupported JSON value for NOWPayments signature")
	}
}

func errorsIsTopUpAlreadyClosed(err error) bool {
	return errors.Is(err, model.ErrTopUpStatusInvalid) || errors.Is(err, model.ErrTopUpNotFound)
}

func getNowPaymentsCheckoutErrorMessage(err error) string {
	if err == nil {
		return "Crypto checkout creation failed"
	}

	message := strings.TrimSpace(err.Error())
	if message == "" {
		return "Crypto checkout creation failed"
	}

	message = strings.ReplaceAll(message, "\n", " ")
	message = strings.Join(strings.Fields(message), " ")
	if len(message) > 240 {
		message = message[:240] + "..."
	}

	return "Crypto checkout creation failed: " + message
}
