/**
 * The centre's WhatsApp enquiry line.
 *
 * WhatsApp is where most new students and hire enquiries actually arrive, so
 * the number lives here rather than being typed into each component that needs
 * it. Digits only, international format, no `+` — that is the form the click-to-
 * chat endpoint expects.
 */
export const WHATSAPP_NUMBER = '6281246877087'

/** Human-readable form, for anywhere the number is displayed rather than linked. */
export const WHATSAPP_DISPLAY = '+62 81 246 877087'

/**
 * A click-to-chat link that opens WhatsApp with `message` already typed in.
 *
 * Nothing is sent by following this link: WhatsApp only pre-fills the compose
 * box, and the visitor still has to press send themselves.
 *
 * URLSearchParams encodes spaces as `+`, which is what the endpoint expects.
 */
export const whatsappUrl = (message: string): string => {
  const params = new URLSearchParams({
    phone: WHATSAPP_NUMBER,
    text: message,
    type: 'phone_number',
    app_absent: '0',
  })
  return `https://api.whatsapp.com/send/?${params.toString()}`
}
