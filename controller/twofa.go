package controller

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
)

// Setup2FARequest 设置2FA请求结构
type Setup2FARequest struct {
	Code string `json:"code" binding:"required"`
}

// Verify2FARequest 验证2FA请求结构
type Verify2FARequest struct {
	Code string `json:"code" binding:"required"`
}

// Setup2FAResponse 设置2FA响应结构
type Setup2FAResponse struct {
	Secret      string   `json:"secret"`
	QRCodeData  string   `json:"qr_code_data"`
	BackupCodes []string `json:"backup_codes"`
}

// Setup2FA 初始化2FA设置
func Setup2FA(c *gin.Context) {
	userId := c.GetInt("id")

	// 检查用户是否已经启用2FA
	existing, err := model.GetTwoFAByUserId(userId)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	if existing != nil && existing.IsEnabled {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "The user has enabled 2FA, please disable it first and then reset it.",
		})
		return
	}

	// 如果存在已禁用的2FA记录，先删除它
	if existing != nil && !existing.IsEnabled {
		if err := existing.Delete(); err != nil {
			common.ApiError(c, err)
			return
		}
		existing = nil // 重置为nil，后续将创建新记录
	}

	// 获取用户信息
	username, err := model.GetUsernameById(userId, false)
	if err != nil {
		common.ApiError(c, err)
		return
	}

	// 生成TOTP密钥
	key, err := common.GenerateTOTPSecret(username)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "Failed to generate 2FA key",
		})
		common.SysLog("Failed to generate TOTP key:" + err.Error())
		return
	}

	// 生成备用码
	backupCodes, err := common.GenerateBackupCodes()
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "Failed to generate backup code",
		})
		common.SysLog("Failed to generate backup code:" + err.Error())
		return
	}

	// 生成二维码数据
	qrCodeData := common.GenerateQRCodeData(key.Secret(), username)

	// 创建或更新2FA记录（暂未启用）
	twoFA := &model.TwoFA{
		UserId:    userId,
		Secret:    key.Secret(),
		IsEnabled: false,
	}

	if existing != nil {
		// 更新现有记录
		twoFA.Id = existing.Id
		err = twoFA.Update()
	} else {
		// 创建新记录
		err = twoFA.Create()
	}

	if err != nil {
		common.ApiError(c, err)
		return
	}

	// 创建备用码记录
	if err := model.CreateBackupCodes(userId, backupCodes); err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "Failed to save backup code",
		})
		common.SysLog("Failed to save backup code:" + err.Error())
		return
	}

	// 记录操作日志
	model.RecordLog(userId, model.LogTypeSystem, "Get started setting up 2-step verification")

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "The 2FA setting is initialized successfully. Please use the authenticator to scan the QR code and enter the verification code to complete the setting.",
		"data": Setup2FAResponse{
			Secret:      key.Secret(),
			QRCodeData:  qrCodeData,
			BackupCodes: backupCodes,
		},
	})
}

// Enable2FA 启用2FA
func Enable2FA(c *gin.Context) {
	var req Setup2FARequest
	if err := common.DecodeJson(c.Request.Body, &req); err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "Parameter error",
		})
		return
	}

	userId := c.GetInt("id")

	// 获取2FA记录
	twoFA, err := model.GetTwoFAByUserId(userId)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	if twoFA == nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "Please complete the 2FA initialization settings first",
		})
		return
	}
	if twoFA.IsEnabled {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "2FA is enabled",
		})
		return
	}

	// 验证TOTP验证码
	cleanCode, err := common.ValidateNumericCode(req.Code)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	if !common.ValidateTOTPCode(twoFA.Secret, cleanCode) {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "Verification code or backup code is wrong, please try again",
		})
		return
	}

	// 启用2FA
	if err := twoFA.Enable(); err != nil {
		common.ApiError(c, err)
		return
	}

	// 记录操作日志
	model.RecordLog(userId, model.LogTypeSystem, "Successfully enabled two-step verification")

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Two-step verification enabled successfully",
	})
}

// Disable2FA 禁用2FA
func Disable2FA(c *gin.Context) {
	var req Verify2FARequest
	if err := common.DecodeJson(c.Request.Body, &req); err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "Parameter error",
		})
		return
	}

	userId := c.GetInt("id")

	// 获取2FA记录
	twoFA, err := model.GetTwoFAByUserId(userId)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	if twoFA == nil || !twoFA.IsEnabled {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "User does not enable 2FA",
		})
		return
	}

	// 验证TOTP验证码或备用码
	cleanCode, err := common.ValidateNumericCode(req.Code)
	isValidTOTP := false
	isValidBackup := false

	if err == nil {
		// 尝试验证TOTP
		isValidTOTP, _ = twoFA.ValidateTOTPAndUpdateUsage(cleanCode)
	}

	if !isValidTOTP {
		// 尝试验证备用码
		isValidBackup, err = twoFA.ValidateBackupCodeAndUpdateUsage(req.Code)
		if err != nil {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": err.Error(),
			})
			return
		}
	}

	if !isValidTOTP && !isValidBackup {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "Verification code or backup code is wrong, please try again",
		})
		return
	}

	// 禁用2FA
	if err := model.DisableTwoFA(userId); err != nil {
		common.ApiError(c, err)
		return
	}

	// 记录操作日志
	model.RecordLog(userId, model.LogTypeSystem, "Disable two-step verification")

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Two-step verification is disabled",
	})
}

// Get2FAStatus 获取用户2FA状态
func Get2FAStatus(c *gin.Context) {
	userId := c.GetInt("id")

	twoFA, err := model.GetTwoFAByUserId(userId)
	if err != nil {
		common.ApiError(c, err)
		return
	}

	status := map[string]interface{}{
		"enabled": false,
		"locked":  false,
	}

	if twoFA != nil {
		status["enabled"] = twoFA.IsEnabled
		status["locked"] = twoFA.IsLocked()
		if twoFA.IsEnabled {
			// 获取剩余备用码数量
			backupCount, err := model.GetUnusedBackupCodeCount(userId)
			if err != nil {
				common.SysLog("Failed to obtain backup code quantity:" + err.Error())
			} else {
				status["backup_codes_remaining"] = backupCount
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    status,
	})
}

// RegenerateBackupCodes 重新生成备用码
func RegenerateBackupCodes(c *gin.Context) {
	var req Verify2FARequest
	if err := common.DecodeJson(c.Request.Body, &req); err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "Parameter error",
		})
		return
	}

	userId := c.GetInt("id")

	// 获取2FA记录
	twoFA, err := model.GetTwoFAByUserId(userId)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	if twoFA == nil || !twoFA.IsEnabled {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "User does not enable 2FA",
		})
		return
	}

	// 验证TOTP验证码
	cleanCode, err := common.ValidateNumericCode(req.Code)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	valid, err := twoFA.ValidateTOTPAndUpdateUsage(cleanCode)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	if !valid {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "Verification code or backup code is wrong, please try again",
		})
		return
	}

	// 生成新的备用码
	backupCodes, err := common.GenerateBackupCodes()
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "Failed to generate backup code",
		})
		common.SysLog("Failed to generate backup code:" + err.Error())
		return
	}

	// 保存新的备用码
	if err := model.CreateBackupCodes(userId, backupCodes); err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "Failed to save backup code",
		})
		common.SysLog("Failed to save backup code:" + err.Error())
		return
	}

	// 记录操作日志
	model.RecordLog(userId, model.LogTypeSystem, "Regenerate 2-Step Verification backup code")

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Backup code regenerated successfully",
		"data": map[string]interface{}{
			"backup_codes": backupCodes,
		},
	})
}

// Verify2FALogin 登录时验证2FA
func Verify2FALogin(c *gin.Context) {
	var req Verify2FARequest
	if err := common.DecodeJson(c.Request.Body, &req); err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "Parameter error",
		})
		return
	}

	// 从会话中获取pending用户信息
	session := sessions.Default(c)
	pendingUserId := session.Get("pending_user_id")
	if pendingUserId == nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "The session has expired, please log in again",
		})
		return
	}
	userId, ok := pendingUserId.(int)
	if !ok {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "The session data is invalid, please log in again",
		})
		return
	}
	// 获取用户信息
	user, err := model.GetLoginUserById(userId)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "User does not exist",
		})
		return
	}

	// 获取2FA记录
	twoFA, err := model.GetTwoFAByUserId(user.Id)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	if twoFA == nil || !twoFA.IsEnabled {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "User does not enable 2FA",
		})
		return
	}

	// 验证TOTP验证码或备用码
	cleanCode, err := common.ValidateNumericCode(req.Code)
	isValidTOTP := false
	isValidBackup := false

	if err == nil {
		// 尝试验证TOTP
		isValidTOTP, _ = twoFA.ValidateTOTPAndUpdateUsage(cleanCode)
	}

	if !isValidTOTP {
		// 尝试验证备用码
		isValidBackup, err = twoFA.ValidateBackupCodeAndUpdateUsage(req.Code)
		if err != nil {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": err.Error(),
			})
			return
		}
	}

	if !isValidTOTP && !isValidBackup {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "Verification code or backup code is wrong, please try again",
		})
		return
	}

	// 2FA验证成功，清理pending会话信息并完成登录
	session.Delete("pending_username")
	session.Delete("pending_user_id")
	session.Save()

	setupLogin(user, c)
}

// Admin2FAStats 管理员获取2FA统计信息
func Admin2FAStats(c *gin.Context) {
	stats, err := model.GetTwoFAStats()
	if err != nil {
		common.ApiError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    stats,
	})
}

// AdminDisable2FA 管理员强制禁用用户2FA
func AdminDisable2FA(c *gin.Context) {
	userIdStr := c.Param("id")
	userId, err := strconv.Atoi(userIdStr)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "User ID format error",
		})
		return
	}

	// 检查目标用户权限
	targetUser, err := model.GetUserById(userId, false)
	if err != nil {
		common.ApiError(c, err)
		return
	}

	myRole := c.GetInt("role")
	if myRole <= targetUser.Role && myRole != common.RoleRootUser {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "Do not have permission to operate the 2FA settings of users of the same level or higher",
		})
		return
	}

	// 禁用2FA
	if err := model.DisableTwoFA(userId); err != nil {
		if errors.Is(err, model.ErrTwoFANotEnabled) {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": "User does not enable 2FA",
			})
			return
		}
		common.ApiError(c, err)
		return
	}

	// 记录操作日志：管理员身份通过 admin_info 传递，避免在非管理员可见的日志内容中泄露。
	adminId := c.GetInt("id")
	adminName := c.GetString("username")
	adminInfo := map[string]interface{}{
		"admin_id":       adminId,
		"admin_username": adminName,
	}
	model.RecordLogWithAdminInfo(userId, model.LogTypeManage,
		"Admin forcefully disables 2-step verification for user", adminInfo)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "User 2FA has been forcibly disabled",
	})
}
