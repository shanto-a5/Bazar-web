"use client";

import { useEffect, useState } from "react";
import { Alert, Badge, Button, EmptyState, Field, Input, Spinner, Textarea } from "@/components/ui";
import { getBrowserApi } from "@/lib/api/bazar-api";
import { ApiError } from "@/lib/api/client";
import type { AddressDto, AddressInput } from "@/lib/types";

const empty: AddressInput = {
  label: "Home",
  recipientName: "",
  phone: "",
  division: "",
  district: "",
  area: "",
  addressLine: "",
  postalCode: "",
  instructions: "",
};

export default function AddressesPage() {
  const api = getBrowserApi();
  const [addresses, setAddresses] = useState<AddressDto[] | null>(null);
  const [form, setForm] = useState<AddressInput>(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api
      .addresses()
      .then((result) => active && setAddresses(result.addresses))
      .catch(() => active && setError("Could not load your addresses."));
    return () => {
      active = false;
    };
  }, [api]);

  function startAdd() {
    setForm(empty);
    setEditingId(null);
    setShowForm(true);
  }

  function startEdit(address: AddressDto) {
    setForm({
      label: address.label,
      recipientName: address.recipientName,
      phone: address.phone,
      division: address.division,
      district: address.district,
      area: address.area,
      addressLine: address.addressLine,
      postalCode: address.postalCode,
      instructions: address.instructions ?? "",
      isDefault: address.isDefault,
    });
    setEditingId(address.id);
    setShowForm(true);
  }

  function update<K extends keyof AddressInput>(key: K, value: AddressInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!form.recipientName || !form.phone || !form.division || !form.district || !form.addressLine) {
      setError("Please complete all required fields.");
      return;
    }
    setBusy(true);
    try {
      if (editingId) await api.updateAddress(editingId, form);
      else await api.createAddress(form);
      const result = await api.addresses();
      setAddresses(result.addresses);
      setShowForm(false);
      setEditingId(null);
      setForm(empty);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save the address.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    setError(null);
    try {
      await api.deleteAddress(id);
      setAddresses((prev) => (prev ? prev.filter((address) => address.id !== id) : prev));
    } catch {
      setError("Could not delete the address.");
    } finally {
      setBusy(false);
    }
  }

  async function makeDefault(id: string) {
    setBusy(true);
    setError(null);
    try {
      await api.setDefaultAddress(id);
      setAddresses((prev) => (prev ? prev.map((address) => ({ ...address, isDefault: address.id === id })) : prev));
    } catch {
      setError("Could not update the default address.");
    } finally {
      setBusy(false);
    }
  }

  if (!addresses && !error) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="text-brand-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">Addresses</h1>
        {!showForm && <Button onClick={startAdd}>Add address</Button>}
      </div>

      {error && <Alert>{error}</Alert>}

      {showForm && (
        <form onSubmit={save} className="grid gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4 sm:grid-cols-2">
          <Field label="Label" htmlFor="label"><Input id="label" value={form.label ?? ""} onChange={(e) => update("label", e.target.value)} placeholder="Home, Office…" /></Field>
          <Field label="Full name" htmlFor="recipientName"><Input id="recipientName" value={form.recipientName} onChange={(e) => update("recipientName", e.target.value)} /></Field>
          <Field label="Mobile number" htmlFor="phone"><Input id="phone" inputMode="numeric" value={form.phone} onChange={(e) => update("phone", e.target.value)} /></Field>
          <Field label="Division" htmlFor="division"><Input id="division" value={form.division} onChange={(e) => update("division", e.target.value)} /></Field>
          <Field label="District" htmlFor="district"><Input id="district" value={form.district} onChange={(e) => update("district", e.target.value)} /></Field>
          <Field label="Area" htmlFor="area"><Input id="area" value={form.area ?? ""} onChange={(e) => update("area", e.target.value)} /></Field>
          <Field label="Postal code" htmlFor="postalCode"><Input id="postalCode" value={form.postalCode ?? ""} onChange={(e) => update("postalCode", e.target.value)} /></Field>
          <div className="sm:col-span-2"><Field label="Street address" htmlFor="addressLine"><Input id="addressLine" value={form.addressLine} onChange={(e) => update("addressLine", e.target.value)} /></Field></div>
          <div className="sm:col-span-2"><Field label="Delivery instructions" htmlFor="instructions"><Textarea id="instructions" value={form.instructions ?? ""} onChange={(e) => update("instructions", e.target.value)} /></Field></div>
          <label className="flex items-center gap-2 text-sm text-ink sm:col-span-2">
            <input type="checkbox" checked={form.isDefault ?? false} onChange={(e) => update("isDefault", e.target.checked)} />
            Set as default address
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" disabled={busy}>{editingId ? "Save changes" : "Add address"}</Button>
            <Button type="button" variant="ghost" onClick={() => { setShowForm(false); setEditingId(null); setForm(empty); }}>Cancel</Button>
          </div>
        </form>
      )}

      {addresses && addresses.length === 0 && !showForm && (
        <EmptyState title="No addresses yet" description="Add a delivery address to check out faster." action={<Button onClick={startAdd}>Add address</Button>} />
      )}

      <ul className="flex flex-col gap-3">
        {addresses?.map((address) => (
          <li key={address.id} className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-ink">{address.recipientName}</span>
              {address.label && <Badge tone="neutral">{address.label}</Badge>}
              {address.isDefault && <Badge tone="brand">Default</Badge>}
            </div>
            <p className="mt-1 text-sm text-ink-muted">{address.phone}</p>
            <p className="text-sm text-ink-muted">
              {[address.addressLine, address.area, address.district, address.division, address.postalCode].filter(Boolean).join(", ")}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {!address.isDefault && <Button size="sm" variant="outline" disabled={busy} onClick={() => makeDefault(address.id)}>Set default</Button>}
              <Button size="sm" variant="outline" disabled={busy} onClick={() => startEdit(address)}>Edit</Button>
              <Button size="sm" variant="ghost" disabled={busy} onClick={() => remove(address.id)}>Delete</Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
