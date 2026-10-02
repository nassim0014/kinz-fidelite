/** Opens WhatsApp on the customer's number with a prefilled message; a person still presses Send. */
export function waLink(phone: string, text: string): string {
  return `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
}

export function smsLink(phone: string, text: string): string {
  return `sms:${phone}?body=${encodeURIComponent(text)}`;
}
