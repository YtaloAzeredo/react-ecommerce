import { zodResolver } from '@hookform/resolvers/zod'
import { startTransition, useEffect, useRef, useState } from 'react'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import { Navigate, useNavigate } from 'react-router'
import { useCart } from '@/features/cart/useCart'
import { PaymentDeclinedError, submitOrder } from '../api/orderService'
import { AddressFields } from '../components/AddressFields'
import { CustomerFields } from '../components/CustomerFields'
import { OrderSummary } from '../components/OrderSummary'
import { PaymentSection } from '../components/PaymentSection'
import { clearCheckoutDraft, loadCheckoutDraft, saveCheckoutDraft } from '../model/checkoutDraft'
import { checkoutSchema, type CheckoutFormValues } from '../model/checkoutSchema'
import { quoteShipping } from '../model/shipping'
import { getPaymentStrategy } from '../payment/paymentStrategies'

export function CheckoutPage() {
  const { items } = useCart()
  const [orderPlaced, setOrderPlaced] = useState(false)

  if (items.length === 0 && !orderPlaced) return <Navigate to="/cart" replace />
  return <CheckoutForm onOrderPlaced={() => setOrderPlaced(true)} />
}

function CheckoutForm({ onOrderPlaced }: { onOrderPlaced: () => void }) {
  const { items, subtotalCents, clear } = useCart()
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const errorRef = useRef<HTMLDivElement>(null)
  const [defaultValues] = useState(buildDefaultValues)

  const form = useForm({
    resolver: zodResolver(checkoutSchema),
    mode: 'onTouched',
    defaultValues,
  })
  const method = useWatch({ control: form.control, name: 'payment.method' })
  const cep = useWatch({ control: form.control, name: 'address.cep' })
  const shipping = quoteShipping(cep, subtotalCents)
  const discountCents = subtotalCents - getPaymentStrategy(method).computeTotalCents(subtotalCents)
  const totalCents = subtotalCents - discountCents + (shipping?.costCents ?? 0)

  useEffect(
    () =>
      form.subscribe({
        formState: { values: true },
        callback: ({ values }) => saveCheckoutDraft(values),
      }),
    [form],
  )

  useEffect(() => {
    if (submitError) errorRef.current?.focus()
  }, [submitError])

  async function onSubmit(values: CheckoutFormValues) {
    const quote = quoteShipping(values.address.cep, subtotalCents)
    if (!quote) {
      form.setError('address.cep', { type: 'manual', message: 'CEP inválido' })
      return
    }
    setSubmitError(null)
    setSending(true)
    try {
      const confirmation = await submitOrder({
        ...values,
        items,
        shippingCents: quote.costCents,
        deliveryDays: quote.deliveryDays,
        totalCents: subtotalCents - discountCents + quote.costCents,
      })
      onOrderPlaced()
      clearCheckoutDraft()
      await navigate('/checkout/success', { replace: true, state: confirmation })
      startTransition(() => clear())
    } catch (error) {
      setSubmitError(
        error instanceof PaymentDeclinedError
          ? `${error.message} Tente outro cartão ou outra forma de pagamento.`
          : 'Não foi possível finalizar o pedido. Tente novamente.',
      )
    } finally {
      setSending(false)
    }
  }

  const { isSubmitting } = form.formState

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Finalizar compra</h1>
      <FormProvider {...form}>
        <form
          noValidate
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid items-start gap-8 lg:grid-cols-[1fr_22rem]"
        >
          <fieldset disabled={sending} className="flex min-w-0 flex-col gap-8">
            <CustomerFields />
            <AddressFields shipping={shipping} />
            <PaymentSection totalCents={totalCents} />
          </fieldset>
          <div className="flex flex-col gap-4 lg:sticky lg:top-4">
            <OrderSummary
              items={items}
              subtotalCents={subtotalCents}
              discountCents={discountCents}
              shippingCents={shipping?.costCents ?? null}
              totalCents={totalCents}
            />
            {submitError && (
              <div
                ref={errorRef}
                tabIndex={-1}
                className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
              >
                <div role="alert">{submitError}</div>
              </div>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-slate-900 px-4 py-3 font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {sending ? 'Enviando…' : 'Finalizar pedido'}
            </button>
            <p role="status" className="sr-only">
              {sending ? 'Enviando pedido…' : ''}
            </p>
          </div>
        </form>
      </FormProvider>
    </section>
  )
}

function buildDefaultValues() {
  const draft = loadCheckoutDraft()
  return {
    customer: { fullName: '', email: '', cpf: '', phone: '', ...draft?.customer },
    address: {
      cep: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      ...draft?.address,
    },
    payment: getPaymentStrategy('credit_card').defaultValues,
  }
}
