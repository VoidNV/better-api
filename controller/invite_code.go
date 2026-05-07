package controller

import (
	"net/http"
	"strconv"
	"strings"
	"unicode/utf8"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/i18n"
	"github.com/QuantumNous/new-api/model"
	"github.com/gin-gonic/gin"
)

type addInviteCodeRequest struct {
	Count       int    `json:"count"`
	ExpiredTime int64  `json:"expired_time"`
	ExpiresAt   *int64 `json:"expires_at"`
	Note        string `json:"note"`
}

func GetAllInviteCodes(c *gin.Context) {
	pageInfo := common.GetPageQuery(c)
	inviteCodes, total, err := model.GetAllInviteCodes(pageInfo.GetStartIdx(), pageInfo.GetPageSize())
	if err != nil {
		common.ApiError(c, err)
		return
	}
	pageInfo.SetTotal(int(total))
	pageInfo.SetItems(inviteCodes)
	common.ApiSuccess(c, pageInfo)
}

func SearchInviteCodes(c *gin.Context) {
	keyword := c.Query("keyword")
	pageInfo := common.GetPageQuery(c)
	inviteCodes, total, err := model.SearchInviteCodes(keyword, pageInfo.GetStartIdx(), pageInfo.GetPageSize())
	if err != nil {
		common.ApiError(c, err)
		return
	}
	pageInfo.SetTotal(int(total))
	pageInfo.SetItems(inviteCodes)
	common.ApiSuccess(c, pageInfo)
}

func AddInviteCodes(c *gin.Context) {
	req := addInviteCodeRequest{}
	if err := common.DecodeJson(c.Request.Body, &req); err != nil {
		common.ApiErrorI18n(c, i18n.MsgInvalidParams)
		return
	}
	if req.ExpiresAt != nil {
		req.ExpiredTime = *req.ExpiresAt
	}
	req.Note = strings.TrimSpace(req.Note)
	if req.Count <= 0 || req.Count > 100 {
		common.ApiErrorI18n(c, i18n.MsgInviteCodeCountInvalid)
		return
	}
	if utf8.RuneCountInString(req.Note) > 255 {
		common.ApiErrorI18n(c, i18n.MsgInviteCodeNoteTooLong)
		return
	}
	if req.ExpiredTime != 0 && req.ExpiredTime < common.GetTimestamp() {
		common.ApiErrorI18n(c, i18n.MsgInviteCodeExpireTimeInvalid)
		return
	}

	codes := make([]string, 0, req.Count)
	for i := 0; i < req.Count; i++ {
		code := common.GetUUID()
		inviteCode := model.InviteCode{
			Code:        code,
			Note:        req.Note,
			CreatedBy:   c.GetInt("id"),
			CreatedTime: common.GetTimestamp(),
			ExpiredTime: req.ExpiredTime,
		}
		if err := inviteCode.Insert(); err != nil {
			common.SysError("failed to insert invite code: " + err.Error())
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": i18n.T(c, i18n.MsgInviteCodeCreateFailed),
				"data":    codes,
			})
			return
		}
		codes = append(codes, code)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    codes,
	})
}

func DeleteInviteCode(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		common.ApiErrorI18n(c, i18n.MsgInvalidId)
		return
	}
	if err := model.DeleteInviteCodeById(id); err != nil {
		common.ApiError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
	})
}
