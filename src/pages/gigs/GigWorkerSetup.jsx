import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useCookies } from "react-cookie";
import { toast } from "react-toastify";
import { authContext } from "../../context/authContext";
import { createGigWorkerProfile } from "../../api/gigs";
import {
  IoPersonCircleOutline,
  IoImageOutline,
  IoCloseCircle,
  IoCheckmarkCircle,
} from "react-icons/io5";
import { FaBriefcase, FaStar, FaUsers, FaMoneyBillWave } from "react-icons/fa";

const PERKS = [
  { icon: <FaMoneyBillWave className="text-green-400" />, title: "Earn on Your Terms", desc: "Set your own prices and work schedule." },
  { icon: <FaUsers className="text-blue-400" />, title: "Global Buyers", desc: "Reach thousands of customers on PinkSurfing." },
  { icon: <FaStar className="text-yellow-400" />, title: "Build Your Reputation", desc: "Grow your rating with every completed order." },
];

const GigWorkerSetup = () => {
  const navigate = useNavigate();
  const [cookies] = useCookies(["access_token"]);
  const { user } = useContext(authContext);

  const [bio, setBio] = useState("");
  const [profilePic, setProfilePic] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setProfilePic(file);
    setProfilePicPreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setProfilePic(null);
    setProfilePicPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cookies.access_token) {
      toast.error("Please sign in first.");
      navigate("/signin");
      return;
    }
    if (!bio.trim()) {
      toast.error("Please write a short bio.");
      return;
    }
    try {
      setSubmitting(true);
      await createGigWorkerProfile(cookies.access_token, {
        bio: bio.trim(),
        profile_picture: profilePic,
      });
      toast.success("Gig worker profile created! You can now post gigs.");
      navigate("/gigs/create");
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.non_field_errors?.[0] ||
        "Failed to create gig worker profile.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#0a0a0f] min-h-screen relative overflow-hidden py-8 px-4">
      {/* Orbs */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-pink-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-4">
            <FaBriefcase className="text-pink-400 text-sm" />
            <span className="text-white/60 text-sm font-medium">Become a Gig Worker</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Start selling your{" "}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              skills today
            </span>
          </h1>
          <p className="text-white/50 text-base max-w-lg mx-auto">
            Create your gig worker profile and start offering services to thousands of buyers on PinkSurfing.
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Form */}
          <motion.form
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onSubmit={handleSubmit}
            className="w-full lg:w-[55%] bg-[#13131a] border border-white/5 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl shadow-purple-500/10"
          >
            {/* Profile picture */}
            <div className="space-y-2">
              <label className="text-white/70 text-sm font-medium">
                Profile Picture <span className="text-white/30 text-xs font-normal">(optional)</span>
              </label>
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 rounded-full overflow-hidden flex-shrink-0">
                  {profilePicPreview ? (
                    <>
                      <img src={profilePicPreview} alt="preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-0.5 right-0.5 bg-black/60 rounded-full"
                      >
                        <IoCloseCircle className="text-red-400 text-lg" />
                      </button>
                    </>
                  ) : (
                    <div className="w-full h-full bg-[#1a1a24] border border-white/10 rounded-full flex items-center justify-center">
                      <IoPersonCircleOutline className="text-white/20 text-4xl" />
                    </div>
                  )}
                </div>
                <label className="flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-white/10 text-white/50 text-sm cursor-pointer hover:border-purple-500 hover:text-white/80 transition-all">
                  <IoImageOutline className="text-base" />
                  {profilePicPreview ? "Change photo" : "Upload photo"}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-1.5">
              <label className="text-white/70 text-sm font-medium">
                Professional Bio <span className="text-pink-400">*</span>
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell buyers about your expertise, experience, and what makes you stand out…"
                rows={5}
                maxLength={1000}
                className="w-full bg-[#1a1a24] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400 transition-all resize-none"
              />
              <p className="text-white/20 text-xs text-right">{bio.length}/1000</p>
            </div>

            {/* What happens next */}
            <div className="bg-purple-600/5 border border-purple-500/20 rounded-xl p-4 space-y-2">
              <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">What happens next</p>
              {[
                "Your gig worker profile is created",
                "You can post your first gig immediately",
                "Buyers can find and purchase your services",
                "Get paid via Stripe after delivery",
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-2 text-white/50 text-xs">
                  <IoCheckmarkCircle className="text-purple-400 text-sm flex-shrink-0" />
                  {step}
                </div>
              ))}
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={submitting}
              whileHover={{ scale: submitting ? 1 : 1.02 }}
              whileTap={{ scale: submitting ? 1 : 0.98 }}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold text-base shadow-lg hover:shadow-purple-500/40 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating Profile…
                </>
              ) : (
                <>
                  <FaBriefcase />
                  Create Gig Worker Profile
                </>
              )}
            </motion.button>
          </motion.form>

          {/* Perks sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="w-full lg:w-[45%] lg:sticky lg:top-8 space-y-4"
          >
            <div className="bg-[#13131a] border border-white/5 rounded-2xl p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-4">Why Sell on PinkSurfing?</p>
              <div className="space-y-0">
                {PERKS.map((perk, i) => (
                  <React.Fragment key={i}>
                    <div className="flex items-start gap-3 py-4">
                      <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
                        {perk.icon}
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">{perk.title}</p>
                        <p className="text-white/40 text-xs mt-0.5">{perk.desc}</p>
                      </div>
                    </div>
                    {i < PERKS.length - 1 && <div className="border-t border-white/5" />}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="bg-[#13131a] border border-white/5 rounded-2xl p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-3">Fee Structure</p>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-white/50 text-sm">You receive</span>
                  <span className="text-green-400 font-bold text-lg">95%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/50 text-sm">Platform fee</span>
                  <span className="text-white/40 text-sm">5%</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full w-[95%] bg-gradient-to-r from-green-500 to-emerald-400 rounded-full" />
                </div>
                <p className="text-white/30 text-xs">
                  We only take a small 5% fee. You keep 95% of every sale.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default GigWorkerSetup;
