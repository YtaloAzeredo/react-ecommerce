import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
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
import { getPaymentStrategy } from '../payment/paymentStrategies'

export function CheckoutPage() {
  const { items } = useCart()
  // Com o pedido feito, o carrinho esvazia antes de a rota trocar para a confirmação; sem isto, o
  // redirecionamento de carrinho vazio mandaria a pessoa para /cart no meio do caminho.
  const [orderPlaced, setOrderPlaced] = useState(false)

  if (items.length === 0 && !orderPlaced) return <Navigate to="/cart" replace />
  return <CheckoutForm onOrderPlaced={() => setOrderPlaced(true)} />
}

function CheckoutForm({ onOrderPlaced }: { onOrderPlaced: () => void }) {
  const { items, subtotalCents, clear } = useCart()
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState<string | null>(null)
  // Lê o rascunho uma vez, na montagem. (Uma função em `defaultValues` o React Hook Form trata como
  // assíncrona: o formulário começaria sem valores.)
  const [defaultValues] = useState(buildDefaultValues)

  const form = useForm({
    resolver: zodResolver(checkoutSchema),
    mode: 'onTouched',
    defaultValues,
  })
  const method = useWatch({ control: form.control, name: 'payment.method' })
  const totalCents = getPaymentStrategy(method).computeTotalCents(subtotalCents)

  // Dados pessoais e endereço sobrevivem a recarregar a página ou voltar ao carrinho.
  useEffect(
    () =>
      form.subscribe({
        formState: { values: true },
        callback: ({ values }) => saveCheckoutDraft(values),
      }),
    [form],
  )

  async function onSubmit(values: CheckoutFormValues) {
    setSubmitError(null)
    try {
      const confirmation = await submitOrder({ ...values, items, totalCents })
      onOrderPlaced()
      clear()
      clearCheckoutDraft()
      navigate('/checkout/success', { replace: true, state: confirmation })
    } catch (error) {
      setSubmitError(
        error instanceof PaymentDeclinedError
          ? `${error.message} Tente outro cartão ou outra forma de pagamento.`
          : 'Não foi possível finalizar o pedido. Tente novamente.',
      )
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
          <div className="flex flex-col gap-8">
            <CustomerFields />
            <AddressFields />
            <PaymentSection subtotalCents={subtotalCents} />
          </div>
          <div className="flex flex-col gap-4 lg:sticky lg:top-4">
            <OrderSummary items={items} subtotalCents={subtotalCents} totalCents={totalCents} />
            {submitError && (
              <div
                role="alert"
                className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
              >
                {submitError}
              </div>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-slate-900 px-4 py-3 font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isSubmitting ? 'Enviando…' : 'Finalizar pedido'}
            </button>
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
    // O estado fica de fora: sem valor, o select mostra "Selecione".
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
