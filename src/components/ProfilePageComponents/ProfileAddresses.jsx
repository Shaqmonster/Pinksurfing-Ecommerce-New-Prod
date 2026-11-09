import { useCallback, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { MapPinIcon, PlusIcon } from "@heroicons/react/24/outline";
import { authContext } from "../../context/authContext";
import AddressForm from "../AddressForm";
import { useAccessToken } from "../../hooks/useAccessToken";

function formatAddressLine(address) {
  const line1 = [address.street1, address.street2].filter(Boolean).join(", ");
  const line2 = [address.city, address.state, address.country]
    .filter(Boolean)
    .join(", ");
  const zip = address.zip_code ? String(address.zip_code) : "";
  return { line1, line2: zip ? `${line2} - ${zip}` : line2 };
}

function AddressSkeleton() {
  return (
    <div className="rounded-2xl border border-[var(--ps-brd)] bg-[var(--ps-card)] p-5 space-y-3">
      <div className="ps-skeleton h-5 w-40 rounded" />
      <div className="ps-skeleton h-4 w-full max-w-md rounded" />
      <div className="ps-skeleton h-4 w-2/3 max-w-sm rounded" />
      <div className="ps-skeleton h-4 w-28 rounded" />
    </div>
  );
}

export default function ProfileAddresses() {
  const accessToken = useAccessToken();
  const navigate = useNavigate();
  const { isAddressFormOpen, setIsAddressFormOpen } = useContext(authContext);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAddresses = useCallback(async () => {
    if (!accessToken) {
      navigate("/signin");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/api/customer/address/`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const raw = response.data?.addresses;
      const addressesArray = Array.isArray(raw)
        ? raw
        : Object.values(raw || {}).filter(
            (value) => value !== null && value !== undefined
          );

      const sorted = [...addressesArray].sort((a, b) => {
        return new Date(b.updated || 0) - new Date(a.updated || 0);
      });

      setAddresses(sorted);
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.error || "Unable to load addresses",
        { position: "top-center", autoClose: 3000 }
      );
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken, navigate]);

  useEffect(() => {
    if (!accessToken) return;
    // Refresh when the add-address dialog closes (same pattern as Checkout)
    if (!isAddressFormOpen) {
      fetchAddresses();
    }
  }, [accessToken, isAddressFormOpen, fetchAddresses]);

  const openAddAddress = () => setIsAddressFormOpen(true);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white tracking-tight">
            Addresses
          </h2>
          <p className="text-sm text-[var(--ps-muted)] mt-1">
            Manage shipping addresses for checkout and orders.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddAddress}
          className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-[14px] border border-[var(--ps-brd)] bg-[var(--ps-surf)] text-sm font-medium text-white hover:border-[var(--ps-primary)]/50 transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          Add address
        </button>
      </div>

      {loading ? (
        <div className="space-y-3" aria-busy="true" aria-label="Loading addresses">
          {Array.from({ length: 3 }).map((_, i) => (
            <AddressSkeleton key={i} />
          ))}
        </div>
      ) : addresses.length > 0 ? (
        <ul className="space-y-3">
          {addresses.map((address, index) => {
            const { line1, line2 } = formatAddressLine(address);
            return (
              <li
                key={address.id || `${address.zip_code}-${index}`}
                className="rounded-2xl border border-[var(--ps-brd)] bg-[var(--ps-card)] p-5"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--ps-brd)] bg-[var(--ps-surf)]">
                    <MapPinIcon className="h-5 w-5 text-[var(--ps-purple-light)]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white truncate">
                      {address.name || `Address ${index + 1}`}
                    </p>
                    {line1 ? (
                      <p className="text-sm text-[var(--ps-muted)] mt-1 leading-relaxed">
                        {line1}
                      </p>
                    ) : null}
                    {line2 ? (
                      <p className="text-sm text-[var(--ps-muted)] leading-relaxed">
                        {line2}
                      </p>
                    ) : null}
                    {address.phone ? (
                      <p className="text-sm text-[var(--ps-dim)] mt-2">
                        {address.phone}
                      </p>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <button
          type="button"
          onClick={openAddAddress}
          className="w-full rounded-2xl border border-dashed border-[var(--ps-brd)] bg-[var(--ps-card)] p-10 flex flex-col items-center justify-center text-center min-h-[200px] hover:border-[var(--ps-primary)]/50 transition-colors"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--ps-brd)] bg-[var(--ps-surf)] mb-4">
            <MapPinIcon className="h-6 w-6 text-[var(--ps-purple-light)]" />
          </div>
          <p className="text-base font-medium text-white">No addresses yet</p>
          <p className="text-sm text-[var(--ps-muted)] mt-1 max-w-sm">
            Add a shipping address to use at checkout.
          </p>
          <span className="mt-5 inline-flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-[14px] border border-[var(--ps-brd)] text-sm font-medium text-white">
            <PlusIcon className="h-4 w-4" />
            Add address
          </span>
        </button>
      )}

      {isAddressFormOpen && <AddressForm />}
    </div>
  );
}
