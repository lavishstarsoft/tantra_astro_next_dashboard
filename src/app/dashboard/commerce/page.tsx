import { redirect } from 'next/navigation';

export default function CommerceIndexPage() {
  redirect('/dashboard/commerce/orders');
}
