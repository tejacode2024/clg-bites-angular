import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface OrderItem {
  name: string;
  qty: number;
  restaurant_name?: string;
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

// ── Minimal ZIP helper ────────────────────────────────────────────────────────
function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function u16(n: number) { return new Uint8Array([n & 0xff, (n >> 8) & 0xff]); }
function u32(n: number) { return new Uint8Array([n & 0xff,(n>>8)&0xff,(n>>16)&0xff,(n>>24)&0xff]); }
function concat(arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((s,a)=>s+a.length,0);
  const out = new Uint8Array(total); let off = 0;
  for (const a of arrays) { out.set(a,off); off += a.length; }
  return out;
}
function zipFiles(files: {name:string; data:Uint8Array}[]): Uint8Array {
  const enc = new TextEncoder();
  const parts: Uint8Array[] = [];
  const cd: Uint8Array[] = [];
  let offset = 0;
  for (const f of files) {
    const nb = enc.encode(f.name);
    const crc = crc32(f.data);
    const lh = concat([new Uint8Array([0x50,0x4b,0x03,0x04]),u16(20),u16(0),u16(0),u16(0),u16(0),u32(crc),u32(f.data.length),u32(f.data.length),u16(nb.length),u16(0),nb]);
    parts.push(lh, f.data);
    cd.push(concat([new Uint8Array([0x50,0x4b,0x01,0x02]),u16(20),u16(20),u16(0),u16(0),u16(0),u16(0),u32(crc),u32(f.data.length),u32(f.data.length),u16(nb.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(offset),nb]));
    offset += lh.length + f.data.length;
  }
  const cdBytes = concat(cd);
  const eocd = concat([new Uint8Array([0x50,0x4b,0x05,0x06]),u16(0),u16(0),u16(files.length),u16(files.length),u32(cdBytes.length),u32(offset),u16(0)]);
  return concat([...parts, cdBytes, eocd]);
}

// ── XLSX builder (no external deps) ──────────────────────────────────────────
function buildXlsx(sheetRows: (string|number)[][]): Blob {
  const enc = new TextEncoder();
  const esc = (v: string) => v.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const strings: string[] = [];
  const strIdx = new Map<string,number>();
  const si = (s: string): number => {
    if (!strIdx.has(s)) { strIdx.set(s, strings.length); strings.push(s); }
    return strIdx.get(s)!;
  };
  const colRef = (ci: number): string => {
    let r = ''; let n = ci;
    do { r = String.fromCharCode(65 + (n % 26)) + r; n = Math.floor(n / 26) - 1; } while (n >= 0);
    return r;
  };
  let rowsXml = '';
  sheetRows.forEach((row, ri) => {
    let cells = '';
    row.forEach((cell, ci) => {
      const ref = `${colRef(ci)}${ri+1}`;
      if (typeof cell === 'number') {
        cells += `<c r="${ref}"><v>${cell}</v></c>`;
      } else {
        cells += `<c r="${ref}" t="s"><v>${si(String(cell??''))}</v></c>`;
      }
    });
    rowsXml += `<row r="${ri+1}">${cells}</row>`;
  });
  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rowsXml}</sheetData></worksheet>`;
  const ssXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${strings.length}" uniqueCount="${strings.length}">${strings.map(s=>`<si><t xml:space="preserve">${esc(s)}</t></si>`).join('')}</sst>`;
  const wbXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets></workbook>`;
  const wbRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/></Relationships>`;
  const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;
  const ct = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/></Types>`;
  const files = [
    {name:'[Content_Types].xml', data:enc.encode(ct)},
    {name:'_rels/.rels', data:enc.encode(rootRels)},
    {name:'xl/workbook.xml', data:enc.encode(wbXml)},
    {name:'xl/_rels/workbook.xml.rels', data:enc.encode(wbRels)},
    {name:'xl/worksheets/sheet1.xml', data:enc.encode(sheetXml)},
    {name:'xl/sharedStrings.xml', data:enc.encode(ssXml)},
  ];
  return new Blob([zipFiles(files)], {type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}

function downloadXlsx(rows: (string|number)[][], filename: string): void {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(buildXlsx(rows));
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

// ─────────────────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly sb = inject(SupabaseService);

  async fetchOrders(): Promise<Order[]> {
    const { data, error } = await this.sb.client
      .from('orders').select('*').order('created_at', { ascending: true });
    if (error) { console.error('fetchOrders error', error); return []; }
    return (data as Order[]) ?? [];
  }

  async fetchTodayOrderCount(): Promise<number> {
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const { count, error } = await this.sb.client
      .from('orders').select('id', { count: 'exact', head: true })
      .gte('created_at', todayStart.toISOString());
    if (error) { console.error('fetchTodayOrderCount error', error); return 0; }
    return count ?? 0;
  }

  async placeOrder(order: Omit<Order,'id'|'created_at'|'deliver_status'|'pay_status'>): Promise<Order|null> {
    const { data, error } = await this.sb.client
      .from('orders').insert([{ ...order, deliver_status:'pending', pay_status:'pending' }])
      .select().single();
    if (error) { console.error('placeOrder error', error); return null; }
    return data as Order;
  }

  async updateOrder(id: number|string, patch: Partial<Order>): Promise<Order|null> {
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
      .from('orders').update(update).eq('id', id).select().single();
    if (error) { console.error('updateOrder error', error); throw error; }
    return data as Order;
  }

  async deleteOrder(id: number|string): Promise<void> {
    const { error } = await this.sb.client.from('orders').delete().eq('id', id);
    if (error) { console.error('deleteOrder error', error); throw error; }
  }

  async clearAllOrders(): Promise<void> {
    const { error } = await this.sb.client.from('orders').delete().neq('id', 0);
    if (error) { console.error('clearAllOrders error', error); throw error; }
    try { await this.sb.client.rpc('reset_orders_sequence'); } catch { /* ignore */ }
  }

  async fetchConfig(): Promise<{ site_online: boolean; item_flags: Record<string,boolean> }> {
    const { data, error } = await this.sb.client.from('config').select('*').eq('id',1).single();
    if (error || !data) return { site_online: true, item_flags: {} };
    return { site_online: data['site_online']??true, item_flags: data['item_flags']??{} };
  }

  async patchConfig(update: { site_online?: boolean; item_flags?: Record<string,boolean> }): Promise<{ site_online: boolean; item_flags: Record<string,boolean> }> {
    const { data, error } = await this.sb.client.from('config').update(update).eq('id',1).select().single();
    if (error) { console.error('patchConfig error', error); throw error; }
    return { site_online: data['site_online']??true, item_flags: data['item_flags']??{} };
  }

  /** Export orders as .xlsx */
  exportToXlsx(orders: Order[]): void {
    if (!orders.length) return;
    const now = new Date();
    const ds = now.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const fmtDT = (iso: string) => {
      const d = new Date(iso);
      let h = d.getHours(); const ap = h>=12?'PM':'AM'; h = h%12||12;
      return `${String(d.getDate()).padStart(2,'0')} ${MONTHS[d.getMonth()]} | ${String(h).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')} ${ap}`;
    };
    const rows: (string|number)[][] = [
      [`CLGBITES - Today's Orders | ${ds}`], [],
      ['Token','Name','Phone','Restaurant','Item','Qty','Payment Mode','Total','Pay Status','Pending Amt','Deliver Status','Ordered At','Delivered At'],
    ];
    orders.forEach((order, idx) => {
      const token = `#${String(order.token_number ?? idx+1).padStart(3,'0')}`;
      const items = order.items ?? [];
      items.forEach((item, i) => {
        rows.push([
          i===0?token:'', i===0?(order.customer_name??''):'', i===0?(order.customer_phone??''):'',
          item.restaurant_name??'', item.name, item.qty??1,
          i===0?(order.payment_mode==='cod'?'COD':'Prepaid'):'',
          i===0?(order.total??0):'',
          i===0?(order.pay_status??'-'):'',
          i===0?(order.pending_amount?`₹${order.pending_amount}`:''):'',
          i===0?(order.deliver_status??'pending'):'',
          i===0?fmtDT(order.created_at):'',
          i===0?(order.delivered_at?fmtDT(order.delivered_at):''):'',
        ]);
      });
      if (items.length===0) rows.push([token,order.customer_name??'',order.customer_phone??'','','—',0,order.payment_mode==='cod'?'COD':'Prepaid',order.total??0,order.pay_status??'-','',order.deliver_status??'pending',fmtDT(order.created_at),'']);
    });
    downloadXlsx(rows, `clgbites-orders-${now.toISOString().slice(0,10)}.xlsx`);
  }

  /** Export show-off as .xlsx */
  exportShowOffXlsx(items: {name:string;qty:number;restaurant?:string}[], restaurantName?: string): void {
    const now = new Date();
    const ds = now.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
    const title = restaurantName ? `CLGBITES - Show Off | ${restaurantName} | ${ds}` : `CLGBITES - Show Off | ${ds}`;
    const rows: (string|number)[][] = [
      [title], [],
      ['S.No','Restaurant','Item Name','Qty'],
      ...items.map((it,i)=>[i+1, it.restaurant??'', it.name, it.qty]),
    ];
    const suffix = restaurantName?`-${restaurantName.toLowerCase().replace(/\s+/g,'-')}`:'';
    downloadXlsx(rows, `clgbites-showoff${suffix}-${now.toISOString().slice(0,10)}.xlsx`);
  }
}