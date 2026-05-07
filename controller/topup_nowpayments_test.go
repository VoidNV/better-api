package controller

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestNowPaymentsSignatureCanonicalizesObjectKeys(t *testing.T) {
	bodyA := []byte(`{"payment_status":"finished","order_id":"ref_123","price_amount":10.0}`)
	bodyB := []byte(`{"order_id":"ref_123","price_amount":10,"payment_status":"finished"}`)

	sigA, err := generateNowPaymentsSignature(bodyA, "ipn-secret")
	require.NoError(t, err)
	sigB, err := generateNowPaymentsSignature(bodyB, "ipn-secret")
	require.NoError(t, err)

	require.Equal(t, sigA, sigB)
	require.True(t, verifyNowPaymentsSignature(bodyA, sigB, "ipn-secret"))
}

func TestNowPaymentsSignatureRejectsInvalidSecret(t *testing.T) {
	body := []byte(`{"payment_status":"finished","order_id":"ref_123"}`)
	signature, err := generateNowPaymentsSignature(body, "ipn-secret")
	require.NoError(t, err)

	require.False(t, verifyNowPaymentsSignature(body, signature, "other-secret"))
	require.False(t, verifyNowPaymentsSignature(body, signature, ""))
}
