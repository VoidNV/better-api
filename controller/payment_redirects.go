package controller

import (
	"strings"

	"github.com/QuantumNous/new-api/setting/system_setting"
)

func getWalletReturnURL(showHistory bool) string {
	baseURL := strings.TrimRight(system_setting.ServerAddress, "/")
	path := "/wallet/"
	if showHistory {
		path += "?show_history=true"
	}
	return baseURL + path
}

func hasValidPaymentReturnAddress() bool {
	serverAddress := strings.TrimSpace(system_setting.ServerAddress)
	return strings.HasPrefix(serverAddress, "http://") || strings.HasPrefix(serverAddress, "https://")
}
