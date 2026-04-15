import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface OrderItem {
  name: string;
  qty: number;
}

export interface Order {
  id: number | string;
  customer_name: string;
  customer_phone: string;
  items: OrderItem[];
  payment_mode: 'cod' | 'prepaid';
  total: number;
  pay_status: 'pending' | 'paid' | 'unpaid';
  pending_amount?: number | null;
  deliver_status: 'pending' | 'delivered';
  created_at: string;
  delivered_at?: string | null;
  token_number?: number;
}

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly sb = inject(SupabaseService);

  async fetchOrders(): Promise<Order[]> {
    const { data, error } = await this.sb.client
      .from('orders')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) { console.error('fetchOrders error', error); return []; }
    return (data as Order[]) ?? [];
  }

  async placeOrder(order: Omit<Order, 'id' | 'created_at' | 'deliver_status' | 'pay_status'>): Promise<Order | null> {
    const { data, error } = await this.sb.client
      .from('orders')
      .insert([{ ...order, deliver_status: 'pending', pay_status: 'pending' }])
      .select()
      .single();
    if (error) { console.error('placeOrder error', error); return null; }
    return data as Order;
  }

  async updateOrder(id: number | string, patch: Partial<Order>): Promise<Order | null> {
    const update: any = {};
    if (patch.items !== undefined)          update.items          = patch.items;
    if (patch.total !== undefined)          update.total          = patch.total;
    if (patch.deliver_status !== undefined) {
      update.deliver_status = patch.deliver_status;
      if (patch.deliver_status === 'delivered') update.delivered_at = new Date().toISOString();
    }
    if (patch.pay_status !== undefined)     update.pay_status     = patch.pay_status;
    if ('pending_amount' in patch)          update.pending_amount = patch.pending_amount ?? null;

    const { data, error } = await this.sb.client
      .from('orders')
      .update(update)
      .eq('id', id)
      .select()
      .single();
    if (error) { console.error('updateOrder error', error); throw error; }
    return data as Order;
  }

  async deleteOrder(id: number | string): Promise<void> {
    const { error } = await this.sb.client.from('orders').delete().eq('id', id);
    if (error) { console.error('deleteOrder error', error); throw error; }
  }

  async clearAllOrders(): Promise<void> {
    const { error } = await this.sb.client.from('orders').delete().neq('id', 0);
    if (error) { console.error('clearAllOrders error', error); throw error; }
    // Reset sequence so next order starts from #001
    await this.sb.client.rpc('reset_orders_sequence').catch(() => {});
  }

  async fetchConfig(): Promise<{ site_online: boolean; item_flags: Record<string, boolean> }> {
    const { data, error } = await this.sb.client
      .from('config')
      .select('*')
      .eq('id', 1)
      .single();
    if (error || !data) return { site_online: true, item_flags: {} };
    return { site_online: data['site_online'] ?? true, item_flags: data['item_flags'] ?? {} };
  }

  async patchConfig(update: { site_online?: boolean; item_flags?: Record<string, boolean> }): Promise<{ site_online: boolean; item_flags: Record<string, boolean> }> {
    const { data, error } = await this.sb.client
      .from('config')
      .update(update)
      .eq('id', 1)
      .select()
      .single();
    if (error) { console.error('patchConfig error', error); throw error; }
    return { site_online: data['site_online'] ?? true, item_flags: data['item_flags'] ?? {} };
  }

  exportToCSV(orders: Order[]): void {
    if (!orders.length) return;
    const now = new Date();
    const ds = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const fmtDT = (iso: string) => {
      const d = new Date(iso);
      const dd = String(d.getDate()).padStart(2,'0');
      const mon = MONTHS[d.getMonth()];
      let h = d.getHours(); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12;
      return `${dd} ${mon} | ${String(h).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')} ${ap}`;
    };

    const rows: string[][] = [
      [`CLGBITES - Today's Orders | ${ds}`], [],
      ['Token','Name','Phone','Item','Qty','Payment Mode','Total','Payment Status','Pending Amount','Deliver Status','Date & Time','Delivered At'],
    ];

    orders.forEach((order, idx) => {
      const token = `#${String(idx + 1).padStart(3, '0')}`;
      const payMode = order.payment_mode === 'cod' ? 'COD' : 'Prepaid';
      const items = order.items ?? [];
      const payStatus = order.pay_status ?? '-';
      const pendingAmt = order.pending_amount ? `₹${order.pending_amount}` : '';
      const time = fmtDT(order.created_at);
      const deliverStatus = order.deliver_status ?? 'pending';
      const deliveredAt = order.delivered_at ? fmtDT(order.delivered_at) : '';

      items.forEach((item, i) => {
        rows.push([
          i === 0 ? token : '',
          i === 0 ? (order.customer_name ?? '') : '',
          i === 0 ? (order.customer_phone ?? '') : '',
          item.name, String(item.qty ?? 1),
          i === 0 ? payMode : '',
          i === 0 ? (order.total != null ? `₹${order.total}` : '') : '',
          i === 0 ? payStatus : '',
          i === 0 ? pendingAmt : '',
          i === 0 ? deliverStatus : '',
          i === 0 ? time : '',
          i === 0 ? deliveredAt : '',
        ]);
      });
      if (items.length === 0) {
        rows.push([token, order.customer_name ?? '', order.customer_phone ?? '',
          '—', '0', payMode, payStatus, pendingAmt,
          order.total != null ? `₹${order.total}` : '', deliverStatus, time, deliveredAt]);
      }
    });

    const csv = '\uFEFF' + rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    a.download = `clgbites-orders-${now.toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  exportShowOffCSV(items: { name: string; qty: number }[]): void {
    const now = new Date();
    const ds = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const rows: string[][] = [
      [`CLGBITES - Show Off | ${ds}`], [],
      ['S.No', 'Item Name', 'Qty'],
      ...items.map((it, i) => [String(i + 1), it.name, String(it.qty)]),
    ];
    const csv = '\uFEFF' + rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    a.download = `clgbites-showoff-${now.toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
}
