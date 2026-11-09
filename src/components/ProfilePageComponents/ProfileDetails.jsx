import { useContext, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { authContext } from "../../context/authContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { FaCopy, FaCheck } from "react-icons/fa";
import { fetchCustomerProfile, getAccessToken } from "../../utils/authSession";
import { getJoinedYear } from "../../utils/userDisplay";
import { storeUrl, STOREFRONT_BASE } from "../../utils/envUrls";
import { useAccessToken } from "../../hooks/useAccessToken";
import MediaImage from "../ui/MediaImage";

export default function ProfileDetails() {
  const accessToken = useAccessToken();
  const [copied, setCopied] = useState(false);
  const { user: authUser, authToken, setUser } = useContext(authContext);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const [profile, setProfile] = useState({
    customer_phone: "",
    customer_profile_picture: null,
    date_registered: "",
    email: "",
    first_name: "",
    id: "",
    is_active: true,
    last_name: "",
    addresses: [],
    is_vendor: false,
  });

  const [initialData, setInitialData] = useState(null);

  const {
    customer_phone,
    customer_profile_picture,
    first_name,
    last_name,
    is_vendor,
  } = profile;

  const handleOnChange = (e) => {
    const { name, value } = e.target;
    setProfile({
      ...profile,
      [name]: value,
    });
  };

  useEffect(() => {
    const token = authToken || getAccessToken();
    if (!token) {
      setPageLoading(false);
      return;
    }

    let cancelled = false;
    setPageLoading(true);

    void (async () => {
      try {
        const enriched = await fetchCustomerProfile(token);
        if (!enriched || cancelled) return;
        setProfile(enriched);
        setInitialData(enriched);
        setUser(enriched);
      } catch (error) {
        if (cancelled) return;
        if (authUser?.email) {
          setProfile(authUser);
          setInitialData(authUser);
          return;
        }
        console.error(error);
      } finally {
        if (!cancelled) setPageLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authToken, authUser?.email, setUser]);

  const reloadProfile = async () => {
    const token = authToken || getAccessToken();
    if (!token) return;
    try {
      const enriched = await fetchCustomerProfile(token);
      if (!enriched) return;
      setProfile(enriched);
      setInitialData(enriched);
      setUser(enriched);
    } catch (error) {
      console.error(error);
    }
  };

  const UpdateProfile = async (e) => {
    e.preventDefault();
    if (!accessToken) {
      navigate("/signin");
      return;
    }
    try {
      setIsLoading(true);
      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/customer/update-profile/`,
        {
          customer_phone,
          customer_profile_picture,
          first_name,
          last_name,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.status === 200) {
        toast.success("Profile updated successfully", {
          position: "top-center",
        });
        await reloadProfile();
      }
    } catch (error) {
      console.error(error);
      const message =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Failed to update profile. Please fill the details correctly.";
      toast.error(message, {
        position: "top-center",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyStoreLink = () => {
    const url = storeUrl(profile?.vendor?.slug);
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  if (pageLoading) {
    return (
      <div className="w-full max-w-3xl mx-auto space-y-6 pb-16" aria-busy="true">
        <div className="rounded-2xl border border-[var(--ps-brd)] bg-[var(--ps-card)] p-6 flex flex-col sm:flex-row gap-5 items-center sm:items-start">
          <div className="ps-skeleton h-24 w-24 rounded-full shrink-0" />
          <div className="flex-1 w-full space-y-3">
            <div className="ps-skeleton h-7 w-48 rounded mx-auto sm:mx-0" />
            <div className="ps-skeleton h-4 w-32 rounded mx-auto sm:mx-0" />
            <div className="flex gap-2 justify-center sm:justify-start">
              <div className="ps-skeleton h-8 w-24 rounded-lg" />
              <div className="ps-skeleton h-8 w-28 rounded-lg" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--ps-brd)] bg-[var(--ps-card)] p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="ps-skeleton h-3 w-20 rounded" />
                <div className="ps-skeleton h-12 w-full rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 pb-16 relative">
      {isLoading && (
        <div className="absolute inset-0 z-10 rounded-2xl bg-[var(--ps-bg)]/50 backdrop-blur-[1px]" aria-busy="true" />
      )}

      <div className="rounded-2xl border border-[var(--ps-brd)] bg-[var(--ps-card)] p-5 sm:p-6 flex flex-col sm:flex-row gap-5 items-center sm:items-start">
        <MediaImage
          src={
            profile.customer_profile_picture ||
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQIf4R5qPKHPNMyAqV-FjS_OTBB8pfUV29Phg&s"
          }
          alt=""
          className="h-24 w-24 rounded-full object-cover"
          skeletonClassName="h-24 w-24 rounded-full shrink-0 border border-[var(--ps-brd)]"
        />
        <div className="flex-1 text-center sm:text-left space-y-2 min-w-0">
          <h2 className="text-2xl font-semibold text-white tracking-tight truncate">
            {first_name || "Your"} {last_name || "profile"}
          </h2>
          <p className="text-sm text-[var(--ps-muted)] truncate">{profile.email}</p>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
            <span className="inline-flex items-center min-h-[32px] px-3 rounded-lg border border-[var(--ps-brd)] bg-[var(--ps-surf)] text-xs text-[var(--ps-muted)]">
              {getJoinedYear(profile.date_registered)
                ? `Joined ${getJoinedYear(profile.date_registered)}`
                : "Member"}
            </span>
            <span className="inline-flex items-center min-h-[32px] px-3 rounded-lg border border-[var(--ps-primary)]/30 bg-[var(--ps-primary)]/10 text-xs text-[var(--ps-purple-light)]">
              {is_vendor ? "Vendor" : "Customer"}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--ps-brd)] bg-[var(--ps-card)] p-5 sm:p-6">
        <form onSubmit={UpdateProfile} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-[var(--ps-muted)]">First name</span>
              <input
                className="w-full min-h-[48px] rounded-xl border border-[var(--ps-brd)] bg-[var(--ps-surf)] px-4 text-white outline-none focus:border-[var(--ps-primary)]/50 focus:ring-2 focus:ring-[color-mix(in_srgb,var(--ps-primary)_25%,transparent)]"
                name="first_name"
                type="text"
                placeholder="First name"
                value={first_name || ""}
                onChange={handleOnChange}
                required
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-[var(--ps-muted)]">Last name</span>
              <input
                className="w-full min-h-[48px] rounded-xl border border-[var(--ps-brd)] bg-[var(--ps-surf)] px-4 text-white outline-none focus:border-[var(--ps-primary)]/50 focus:ring-2 focus:ring-[color-mix(in_srgb,var(--ps-primary)_25%,transparent)]"
                name="last_name"
                type="text"
                placeholder="Last name"
                value={last_name || ""}
                onChange={handleOnChange}
                required
              />
            </label>

            <label className="block space-y-1.5 sm:col-span-2">
              <span className="text-xs font-medium text-[var(--ps-muted)]">Phone</span>
              <input
                className="w-full min-h-[48px] rounded-xl border border-[var(--ps-brd)] bg-[var(--ps-surf)] px-4 text-white outline-none focus:border-[var(--ps-primary)]/50 focus:ring-2 focus:ring-[color-mix(in_srgb,var(--ps-primary)_25%,transparent)]"
                name="customer_phone"
                type="text"
                placeholder="Phone number"
                value={customer_phone || ""}
                onChange={handleOnChange}
                required
              />
            </label>

            {profile?.vendor?.slug && (
              <div className="space-y-1.5 sm:col-span-2">
                <span className="text-xs font-medium text-[var(--ps-muted)]">Store link</span>
                <div className="flex items-center gap-2 min-h-[48px] rounded-xl border border-[var(--ps-brd)] bg-[var(--ps-surf)] px-3">
                  <a
                    href={storeUrl(profile.vendor.slug)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-sm text-[var(--ps-purple-light)] truncate hover:text-white"
                  >
                    {STOREFRONT_BASE.replace("https://", "")}/store/{profile.vendor.slug}
                  </a>
                  <button
                    type="button"
                    onClick={handleCopyStoreLink}
                    className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg text-[var(--ps-muted)] hover:text-white"
                    aria-label="Copy store link"
                  >
                    {copied ? <FaCheck className="text-green-400" /> : <FaCopy />}
                  </button>
                </div>
              </div>
            )}
          </div>

          {initialData && JSON.stringify(profile) !== JSON.stringify(initialData) && (
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              type="submit"
              disabled={isLoading}
              className="min-h-[48px] px-6 rounded-[14px] bg-gradient-to-r from-[var(--ps-primary)] to-[var(--ps-purple-dark)] text-white text-sm font-semibold disabled:opacity-60"
            >
              {isLoading ? "Saving…" : "Save changes"}
            </motion.button>
          )}
        </form>
      </div>

      {!profile.is_vendor && (
        <div className="rounded-2xl border border-[var(--ps-brd)] bg-[var(--ps-card)] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-white">Sell on PinkSurfing</h3>
            <p className="text-sm text-[var(--ps-muted)] mt-1">
              Open a store and reach buyers across the marketplace.
            </p>
          </div>
          <button
            type="button"
            className="min-h-[44px] px-5 rounded-[14px] border border-[var(--ps-brd)] text-sm font-medium text-white hover:border-[var(--ps-primary)]/50"
            onClick={() => {}}
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}
