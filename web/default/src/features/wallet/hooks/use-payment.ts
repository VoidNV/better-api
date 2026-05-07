import { useState, useCallback } from 'react'
import i18next from 'i18next'
import { toast } from 'sonner'
import {
  calculateAmount,
  calculateNowPaymentsAmount,
  calculateStripeAmount,
  calculateWaffoPancakeAmount,
  requestPayment,
  requestNowPaymentsPayment,
  requestStripePayment,
  isApiSuccess,
} from '../api'
import {
  isStripePayment,
  isNowPaymentsPayment,
  isWaffoPancakePayment,
  submitPaymentForm,
} from '../lib'
import type { ApiResponse } from '../types'

// ============================================================================
// Payment Hook
// ============================================================================

export function usePayment() {
  const [amount, setAmount] = useState<number>(0)
  const [calculating, setCalculating] = useState(false)
  const [processing, setProcessing] = useState(false)

  const getPaymentErrorMessage = useCallback((response: ApiResponse) => {
    if (typeof response.data === 'string' && response.data.trim()) {
      return response.data
    }
    if (response.message && response.message !== 'error') {
      return response.message
    }
    return i18next.t('Payment request failed')
  }, [])

  // Calculate payment amount
  const calculatePaymentAmount = useCallback(
    async (topupAmount: number, paymentType: string) => {
      try {
        setCalculating(true)

        const isStripe = isStripePayment(paymentType)
        const isNowPayments = isNowPaymentsPayment(paymentType)
        const isPancake = isWaffoPancakePayment(paymentType)
        const response = isStripe
          ? await calculateStripeAmount({ amount: topupAmount })
          : isNowPayments
            ? await calculateNowPaymentsAmount({ amount: topupAmount })
          : isPancake
            ? await calculateWaffoPancakeAmount({ amount: topupAmount })
            : await calculateAmount({ amount: topupAmount })

        if (isApiSuccess(response) && response.data) {
          const calculatedAmount = parseFloat(response.data)
          setAmount(calculatedAmount)
          return calculatedAmount
        }

        // Don't show error for calculation, just set to 0
        setAmount(0)
        return 0
      } catch (_error) {
        setAmount(0)
        return 0
      } finally {
        setCalculating(false)
      }
    },
    []
  )

  // Process payment
  const processPayment = useCallback(
    async (topupAmount: number, paymentType: string) => {
      try {
        setProcessing(true)

        const isStripe = isStripePayment(paymentType)
        const isNowPayments = isNowPaymentsPayment(paymentType)
        const amount = Math.floor(topupAmount)

        const response = isStripe
          ? await requestStripePayment({
              amount,
              payment_method: 'stripe',
            })
          : isNowPayments
            ? await requestNowPaymentsPayment({
                amount,
                payment_method: 'nowpayments',
              })
          : await requestPayment({
              amount,
              payment_method: paymentType,
            })

        if (!isApiSuccess(response)) {
          toast.error(getPaymentErrorMessage(response))
          return false
        }

        // Handle Stripe payment
        if (isStripe && response.data?.pay_link) {
          window.open(response.data.pay_link as string, '_blank')
          toast.success(i18next.t('Redirecting to payment page...'))
          return true
        }

        if (isNowPayments && response.data?.invoice_url) {
          window.open(response.data.invoice_url as string, '_blank')
          toast.success(i18next.t('Redirecting to payment page...'))
          return true
        }

        // Handle non-Stripe payment
        if (!isStripe && !isNowPayments && response.data) {
          const url = (response as unknown as { url?: string }).url
          if (url) {
            submitPaymentForm(url, response.data)
            toast.success(i18next.t('Redirecting to payment page...'))
            return true
          }
        }

        return false
      } catch (_error) {
        toast.error(i18next.t('Payment request failed'))
        return false
      } finally {
        setProcessing(false)
      }
    },
    [getPaymentErrorMessage]
  )

  return {
    amount,
    calculating,
    processing,
    calculatePaymentAmount,
    processPayment,
    setAmount,
  }
}
