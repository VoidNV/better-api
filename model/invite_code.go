package model

import (
	"errors"
	"strconv"

	"github.com/QuantumNous/new-api/common"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

var (
	ErrInviteCodeInvalid = errors.New("invalid invite code")
	ErrInviteCodeExpired = errors.New("invite code expired")
)

type InviteCode struct {
	Id           int    `json:"id"`
	Code         string `json:"code" gorm:"type:char(32);uniqueIndex"`
	Status       int    `json:"status" gorm:"default:1"`
	Note         string `json:"note" gorm:"type:varchar(255)"`
	CreatedBy    int    `json:"created_by"`
	CreatedTime  int64  `json:"created_time" gorm:"bigint"`
	UsedByUserId int    `json:"used_by_user_id"`
	UsedTime     int64  `json:"used_time" gorm:"bigint"`
	ExpiredTime  int64  `json:"expired_time" gorm:"bigint"`
}

func GetAllInviteCodes(startIdx int, num int) (inviteCodes []*InviteCode, total int64, err error) {
	err = DB.Model(&InviteCode{}).Count(&total).Error
	if err != nil {
		return nil, 0, err
	}
	err = DB.Order("id desc").Limit(num).Offset(startIdx).Find(&inviteCodes).Error
	if err != nil {
		return nil, 0, err
	}
	return inviteCodes, total, nil
}

func SearchInviteCodes(keyword string, startIdx int, num int) (inviteCodes []*InviteCode, total int64, err error) {
	query := DB.Model(&InviteCode{})
	if id, convErr := strconv.Atoi(keyword); convErr == nil {
		query = query.Where("id = ? OR code LIKE ? OR note LIKE ?", id, keyword+"%", "%"+keyword+"%")
	} else {
		query = query.Where("code LIKE ? OR note LIKE ?", keyword+"%", "%"+keyword+"%")
	}
	err = query.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}
	err = query.Order("id desc").Limit(num).Offset(startIdx).Find(&inviteCodes).Error
	if err != nil {
		return nil, 0, err
	}
	return inviteCodes, total, nil
}

func GetInviteCodeById(id int) (*InviteCode, error) {
	if id == 0 {
		return nil, errors.New("id is empty")
	}
	inviteCode := InviteCode{Id: id}
	err := DB.First(&inviteCode, "id = ?", id).Error
	return &inviteCode, err
}

func GetAndLockInviteCode(tx *gorm.DB, code string) (*InviteCode, error) {
	if code == "" {
		return nil, ErrInviteCodeInvalid
	}
	inviteCode := &InviteCode{}
	query := tx.Where("code = ?", code)
	if !common.UsingSQLite {
		query = query.Clauses(clause.Locking{Strength: "UPDATE"})
	}
	if err := query.First(inviteCode).Error; err != nil {
		return nil, ErrInviteCodeInvalid
	}
	return inviteCode, nil
}

func (inviteCode *InviteCode) ValidateConsumable() error {
	if inviteCode.Status != common.InviteCodeStatusEnabled {
		return ErrInviteCodeInvalid
	}
	if inviteCode.ExpiredTime != 0 && inviteCode.ExpiredTime < common.GetTimestamp() {
		return ErrInviteCodeExpired
	}
	return nil
}

func (inviteCode *InviteCode) MarkUsed(tx *gorm.DB, userId int) error {
	usedTime := common.GetTimestamp()
	result := tx.Model(&InviteCode{}).
		Where("id = ? AND status = ?", inviteCode.Id, common.InviteCodeStatusEnabled).
		Updates(map[string]any{
			"status":          common.InviteCodeStatusUsed,
			"used_by_user_id": userId,
			"used_time":       usedTime,
		})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrInviteCodeInvalid
	}
	inviteCode.Status = common.InviteCodeStatusUsed
	inviteCode.UsedByUserId = userId
	inviteCode.UsedTime = usedTime
	return nil
}

func (inviteCode *InviteCode) Insert() error {
	return DB.Create(inviteCode).Error
}

func DeleteInviteCodeById(id int) error {
	if id == 0 {
		return errors.New("id is empty")
	}
	return DB.Model(&InviteCode{}).Where("id = ?", id).Update("status", common.InviteCodeStatusRevoked).Error
}
