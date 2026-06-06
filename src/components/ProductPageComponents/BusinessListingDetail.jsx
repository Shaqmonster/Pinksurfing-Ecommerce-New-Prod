import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import axios from "axios";
import { toast } from "react-toastify";
import {
  FaHeart,
  FaShare,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaChartLine,
  FaBuilding,
  FaUsers,
  FaUserTie,
  FaHandshake,
  FaCheckCircle,
  FaTimesCircle,
  FaRobot,
  FaTags,
  FaBriefcase,
  FaBalanceScale,
  FaFileAlt,
  FaLock,
  FaEnvelope,
} from "react-icons/fa";
import { IoChatbubbleOutline, IoInformationCircleOutline } from "react-icons/io5";
import parse from "html-react-parser";
import { formatMoney } from "../../utils/formatMoney";
import YouMightAlsoLike from "./YouMightAlsoLike";
import ProductDetailReviewSection from "./ProductDetail-ReviewSection";
import { useAccessToken } from "../../hooks/useAccessToken";

const CSS = `
  .biz-root{--pink:#f0318a;--pink-h:#d4246f;--pink-light:rgba(240,49,138,.12);--pink-mid:rgba(240,49,138,.10);--pink-border:rgba(240,49,138,.28);--bg:#0d0d10;--surface:#141418;--surface-2:#1c1c22;--surface-3:#232329;--border:#2a2a33;--border-2:#36363f;--text:#f0f0f4;--text-2:#b0b0c0;--text-3:#66667a;--green:#34d399;--green-bg:rgba(52,211,153,.10);--green-border:rgba(52,211,153,.22);--amber:#fbbf24;--amber-bg:rgba(251,191,36,.10);--amber-border:rgba(251,191,36,.22);--blue:#60a5fa;--blue-bg:rgba(96,165,250,.10);--blue-border:rgba(96,165,250,.22);--red:#f87171;--red-bg:rgba(248,113,113,.10);--red-border:rgba(248,113,113,.22);--indigo:#a78bfa;--indigo-bg:rgba(167,139,250,.10);--indigo-border:rgba(167,139,250,.22);}
  .biz-root{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text);font-size:14px;line-height:1.5;min-height:100vh;}
  .biz-page{max-width:1200px;margin:0 auto;padding:28px 24px 80px;}
  .biz-grid{display:grid;grid-template-columns:1fr 360px;gap:28px;align-items:start;}
  .biz-main{display:flex;flex-direction:column;gap:20px;min-width:0;}
  .biz-side{position:sticky;top:72px;display:flex;flex-direction:column;gap:14px;}

  /* gallery */
  .b-gallery{border-radius:12px;overflow:hidden;background:var(--surface-2);border:1px solid var(--border);}
  .b-gallery-main{position:relative;width:100%;aspect-ratio:16/9;overflow:hidden;background:var(--surface-3);}
  .b-gallery-main img{width:100%;height:100%;object-fit:cover;display:block;transition:opacity .3s;}
  .b-gallery-badge{position:absolute;top:14px;left:14px;display:flex;gap:6px;flex-wrap:wrap;}
  .b-gallery-price{position:absolute;bottom:14px;right:14px;background:rgba(13,13,16,.85);backdrop-filter:blur(8px);border:1px solid var(--pink-border);border-radius:8px;padding:10px 16px;}
  .b-asking-label{font-size:10px;color:var(--text-3);text-transform:uppercase;letter-spacing:.07em;font-weight:600;margin-bottom:2px;}
  .b-asking-val{font-size:26px;font-weight:800;color:var(--pink);line-height:1;}
  .b-thumbs{display:flex;gap:8px;padding:10px;background:var(--surface-2);}
  .b-thumb{width:72px;height:52px;border-radius:5px;overflow:hidden;cursor:pointer;border:2px solid transparent;transition:all .15s;flex-shrink:0;background:var(--surface-3);}
  .b-thumb.active{border-color:var(--pink);}
  .b-thumb img{width:100%;height:100%;object-fit:cover;}
  .b-thumb-more{width:72px;height:52px;border-radius:5px;border:1.5px dashed var(--border-2);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:var(--text-3);flex-shrink:0;background:var(--surface-3);}

  /* badge */
  .b-badge{display:inline-flex;align-items:center;gap:4px;background:var(--surface-2);border:1px solid var(--border);border-radius:4px;padding:3px 8px;font-size:10px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:.04em;}
  .b-badge.ind{background:var(--blue-bg);border-color:var(--blue-border);color:var(--blue);}
  .b-badge.active-s{background:var(--green-bg);border-color:var(--green-border);color:var(--green);}
  .b-badge.closed{background:var(--red-bg);border-color:var(--red-border);color:var(--red);}
  .b-badge.sba{background:var(--indigo-bg);border-color:var(--indigo-border);color:var(--indigo);}

  /* deal hero */
  .b-hero{background:var(--surface);border:1.5px solid var(--border);border-radius:8px;overflow:hidden;}
  .b-hero-head{padding:20px 22px 16px;border-bottom:1px solid var(--border);}
  .b-hero-title{font-size:22px;font-weight:800;letter-spacing:-.4px;line-height:1.25;margin-bottom:8px;color:var(--text);}
  .b-hero-loc{font-size:13px;color:var(--text-3);display:flex;align-items:center;gap:5px;}
  .b-hero-loc a{color:var(--pink);font-weight:600;cursor:pointer;}
  .b-metrics{display:grid;grid-template-columns:repeat(5,1fr);gap:0;background:var(--surface-2);}
  .b-met{padding:16px 18px;display:flex;flex-direction:column;gap:3px;border-right:1px solid var(--border);}
  .b-met:last-child{border-right:none;}
  .b-met-v{font-size:20px;font-weight:800;color:var(--text);line-height:1;}
  .b-met-v.pink{color:var(--pink);}
  .b-met-v.green{color:var(--green);}
  .b-met-v.amber{color:var(--amber);}
  .b-met-k{font-size:10px;color:var(--text-3);text-transform:uppercase;letter-spacing:.06em;font-weight:600;margin-top:2px;}
  .b-met-note{font-size:10px;color:var(--text-3);margin-top:2px;}

  /* tabs */
  .b-tabs{display:flex;gap:0;border-bottom:1px solid var(--border);background:var(--surface);border-radius:8px 8px 0 0;overflow:hidden;}
  .b-tab{padding:13px 20px;font-size:13px;font-weight:600;color:var(--text-3);cursor:pointer;border-bottom:2px solid transparent;transition:all .15s;white-space:nowrap;flex-shrink:0;background:none;border-top:none;border-left:none;border-right:none;}
  .b-tab:hover{color:var(--text-2);background:var(--surface-2);}
  .b-tab.active{color:var(--pink);border-bottom-color:var(--pink);background:var(--surface);}
  .b-panel{background:var(--surface);border:1.5px solid var(--border);border-top:none;border-radius:0 0 8px 8px;padding:24px;}
  .b-panel h3{font-size:15px;font-weight:700;margin-bottom:14px;color:var(--text);}
  .b-panel h4{font-size:13px;font-weight:700;margin-bottom:10px;color:var(--text-2);}
  .b-divider{border:none;border-top:1px solid var(--border);margin:20px 0;}
  .b-about{font-size:14px;color:var(--text-2);line-height:1.75;}

  /* highlight boxes */
  .b-hl-row{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:18px;}
  .b-hl-box{background:var(--surface-2);border:1.5px solid var(--border);border-radius:6px;padding:14px;display:flex;flex-direction:column;gap:4px;}
  .b-hl-icon{font-size:20px;}
  .b-hl-val{font-size:16px;font-weight:800;color:var(--text);}
  .b-hl-key{font-size:11px;color:var(--text-3);font-weight:600;text-transform:uppercase;letter-spacing:.05em;}

  /* financials table */
  .b-fin-table{width:100%;border-collapse:collapse;font-size:13px;}
  .b-fin-table th{text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--text-3);padding:8px 12px;border-bottom:1px solid var(--border);}
  .b-fin-table th:not(:first-child){text-align:right;}
  .b-fin-table td{padding:10px 12px;border-bottom:1px solid var(--border);color:var(--text-2);}
  .b-fin-table td:not(:first-child){text-align:right;font-family:'DM Mono',monospace;font-size:12px;}
  .b-fin-table tr:last-child td{border-bottom:none;}
  .b-fin-table tr.total td{font-weight:700;color:var(--text);}
  .b-fin-table tr.highlight td{background:var(--pink-light);color:var(--pink);font-weight:700;}
  .b-fin-table .neg{color:var(--red);}
  .b-fin-table .pos{color:var(--green);}


  /* operations */
  .b-ops-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
  .b-ops-card{background:var(--surface-2);border:1.5px solid var(--border);border-radius:6px;padding:14px;}
  .b-ops-card h4{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--text-3);margin-bottom:10px;}
  .b-ops-row{display:flex;justify-content:space-between;align-items:center;font-size:13px;padding:4px 0;}
  .b-ops-key{color:var(--text-3);}
  .b-ops-val{font-weight:600;color:var(--text);text-align:right;}
  .b-flag-wrap{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:4px;}
  .b-flag{display:flex;align-items:center;gap:6px;background:var(--surface);border:1px solid var(--border);border-radius:5px;padding:7px 10px;font-size:12px;font-weight:600;color:var(--text-2);}
  .b-flag.yes{background:var(--green-bg);border-color:var(--green-border);color:var(--green);}
  .b-flag.warn{background:var(--amber-bg);border-color:var(--amber-border);color:var(--amber);}
  .b-flag.no{background:var(--surface);color:var(--text-3);}

  /* smart tags */
  .b-smart-tag{display:inline-flex;align-items:center;gap:5px;background:var(--pink-light);border:1px solid var(--pink-border);color:var(--pink);border-radius:6px;padding:6px 12px;font-size:12px;font-weight:600;margin:3px;}

  /* activity */
  .b-state-msg{display:flex;align-items:flex-start;gap:9px;padding:10px 13px;border-radius:6px;font-size:12px;line-height:1.5;border:1px solid;margin-bottom:6px;}
  .b-state-msg.active-s{background:var(--green-bg);border-color:var(--green-border);color:var(--green);}
  .b-state-msg.info{background:var(--blue-bg);border-color:var(--blue-border);color:var(--blue);}
  .b-sm-text{font-weight:600;}
  .b-sm-ts{font-size:10px;opacity:.65;margin-top:2px;}

  /* location */
  .b-map-ph{width:100%;height:200px;background:var(--surface-2);border-radius:8px;border:1.5px solid var(--border);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;font-size:13px;color:var(--text-3);margin-bottom:16px;}
  .b-loc-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
  .b-loc-item{background:var(--surface-2);border:1.5px solid var(--border);border-radius:6px;padding:12px;}
  .b-loc-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--text-3);margin-bottom:4px;}
  .b-loc-val{font-size:14px;font-weight:600;color:var(--text);}


  /* similar grid */
  .b-sim-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;}
  .b-sim-card{background:var(--surface);border:1.5px solid var(--border);border-radius:8px;padding:16px;cursor:pointer;transition:border-color .15s,transform .12s;}
  .b-sim-card:hover{border-color:var(--pink);transform:translateY(-2px);}

  /* sidebar */
  .b-side-card{background:var(--surface);border:1.5px solid var(--border);border-radius:8px;overflow:hidden;}
  .b-side-asking{padding:14px 18px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;}
  .b-side-asking-val{font-size:28px;font-weight:800;color:var(--pink);}
  .b-side-asking-label{font-size:11px;color:var(--text-3);text-transform:uppercase;letter-spacing:.06em;font-weight:600;}
  .b-side-mini{display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid var(--border);}
  .b-side-met{padding:11px 16px;border-right:1px solid var(--border);}
  .b-side-met:nth-child(even){border-right:none;}
  .b-side-met-v{font-size:15px;font-weight:700;color:var(--text);}
  .b-side-met-k{font-size:10px;color:var(--text-3);text-transform:uppercase;letter-spacing:.05em;font-weight:600;margin-top:1px;}
  .b-meta-row{display:flex;justify-content:space-between;align-items:center;padding:9px 18px;border-bottom:1px solid var(--border);font-size:12px;}
  .b-meta-row:last-child{border-bottom:none;}
  .b-meta-k{color:var(--text-3);}
  .b-meta-v{font-weight:600;color:var(--text);text-align:right;}
  .b-meta-v.green{color:var(--green);}
  .b-meta-v.amber{color:var(--amber);}
  .b-meta-v.pink{color:var(--pink);}


  /* interest form */
  .b-side-head{padding:16px 18px;border-bottom:1px solid var(--border);}
  .b-side-head h3{font-size:15px;font-weight:700;margin-bottom:2px;color:var(--text);}
  .b-side-head p{font-size:12px;color:var(--text-3);line-height:1.4;}
  .b-side-body{padding:16px 18px;}
  .b-form-label{font-size:10px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--text-2);display:block;margin-bottom:5px;}
  .b-form-input,.b-form-select,.b-form-textarea{background:var(--surface-2);border:1.5px solid var(--border);border-radius:6px;color:var(--text);font-size:13px;padding:9px 12px;width:100%;transition:border-color .15s;outline:none;font-family:inherit;margin-bottom:12px;}
  .b-form-input:focus,.b-form-select:focus,.b-form-textarea:focus{border-color:var(--pink);}
  .b-form-select{appearance:none;cursor:pointer;}
  .b-form-textarea{resize:vertical;min-height:80px;line-height:1.5;}
  .b-btn-express{width:100%;background:var(--pink);color:#fff;border:none;padding:12px;border-radius:6px;font-size:14px;font-weight:700;cursor:pointer;transition:background .15s;margin-top:4px;display:flex;align-items:center;justify-content:center;gap:8px;}
  .b-btn-express:hover{background:var(--pink-h);}
  .b-btn-express:disabled{background:var(--surface-3);color:var(--text-3);cursor:not-allowed;}
  .b-btn-express.sending{background:var(--surface-3);}
  .b-form-disclaimer{font-size:11px;color:var(--text-3);text-align:center;margin-top:8px;line-height:1.5;}
  .b-form-row-2{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
  .b-quick-actions{display:flex;gap:8px;margin-bottom:0;}
  .b-btn-qa{flex:1;background:var(--surface-2);border:1.5px solid var(--border);color:var(--text-2);padding:8px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;transition:all .15s;display:flex;align-items:center;justify-content:center;gap:5px;}
  .b-btn-qa:hover{border-color:var(--border-2);color:var(--text);}
  .b-btn-qa.saved{border-color:var(--pink);color:var(--pink);background:var(--pink-light);}


  /* lightbox */
  .b-lightbox{position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:700;display:flex;align-items:center;justify-content:center;}
  .b-lightbox-img{max-width:90vw;max-height:88vh;object-fit:contain;border-radius:6px;display:block;}
  .b-lightbox-close{position:absolute;top:16px;right:20px;background:none;border:none;color:#fff;font-size:28px;cursor:pointer;opacity:.7;line-height:1;}
  .b-lightbox-close:hover{opacity:1;}
  .b-lightbox-prev,.b-lightbox-next{position:absolute;top:50%;transform:translateY(-50%);background:rgba(255,255,255,.08);border:none;color:#fff;font-size:22px;cursor:pointer;padding:12px 16px;border-radius:6px;transition:background .15s;}
  .b-lightbox-prev{left:16px;}
  .b-lightbox-next{right:16px;}
  .b-lightbox-prev:hover,.b-lightbox-next:hover{background:rgba(255,255,255,.18);}
  .b-lightbox-counter{position:absolute;bottom:20px;left:50%;transform:translateX(-50%);color:rgba(255,255,255,.5);font-size:12px;font-weight:600;}

  /* pulse */
  .b-pulse{display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--green);margin-right:5px;vertical-align:middle;animation:b-pulse-dot 2s infinite;}
  @keyframes b-pulse-dot{0%{box-shadow:0 0 0 0 rgba(52,211,153,.4);}70%{box-shadow:0 0 0 7px rgba(52,211,153,0);}100%{box-shadow:0 0 0 0 rgba(52,211,153,0);}}
  @keyframes b-heart-pop{0%{transform:scale(1);}40%{transform:scale(1.4);}70%{transform:scale(.9);}100%{transform:scale(1);}}

  /* success */
  .b-success{text-align:center;padding:20px;}
  .b-success h4{font-size:15px;font-weight:700;margin-bottom:5px;color:var(--green);}
  .b-success p{font-size:12px;color:var(--text-3);line-height:1.5;}

  /* ── NDA ── */
  .b-nda-gate{background:var(--surface-2);border:1.5px solid var(--amber-border);border-radius:8px;padding:28px 24px;text-align:center;margin-top:20px;}
  .b-nda-gate-icon{font-size:40px;margin-bottom:10px;}
  .b-nda-gate h4{font-size:16px;font-weight:700;color:var(--text);margin-bottom:8px;}
  .b-nda-gate p{font-size:13px;color:var(--text-3);line-height:1.6;margin-bottom:16px;max-width:400px;margin-left:auto;margin-right:auto;}
  .b-nda-chips{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-bottom:18px;}
  .b-nda-chip{display:inline-flex;align-items:center;gap:5px;background:var(--amber-bg);border:1px solid var(--amber-border);border-radius:4px;padding:4px 10px;font-size:11px;font-weight:600;color:var(--amber);}
  .b-btn-nda{background:var(--pink);color:#fff;border:none;padding:11px 26px;border-radius:6px;font-size:13px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:7px;transition:background .15s;}
  .b-btn-nda:hover{background:var(--pink-h);}
  .b-nda-side-card{background:var(--amber-bg);border:1.5px solid var(--amber-border);border-radius:8px;padding:16px;}
  .b-nda-side-card h4{font-size:13px;font-weight:700;color:var(--amber);margin-bottom:6px;display:flex;align-items:center;gap:6px;}
  .b-nda-side-card p{font-size:12px;color:var(--amber);line-height:1.5;margin-bottom:12px;opacity:.9;}
  .b-btn-nda-side{width:100%;background:var(--amber);color:#fff;border:none;padding:10px;border-radius:6px;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:filter .15s;}
  .b-btn-nda-side:hover{filter:brightness(0.88);}
  /* NDA modal — variables redeclared here so they resolve outside .biz-root (position:fixed) */
  .b-modal-overlay{
    --surface:#141418;--surface-2:#1c1c22;--surface-3:#232329;
    --border:#2a2a33;--border-2:#3a3a46;
    --text:#f0f0f4;--text-2:#b0b0c0;--text-3:#66667a;
    --pink:#f0318a;--pink-h:#d4246f;--pink-light:rgba(240,49,138,.10);
    position:fixed;inset:0;background:rgba(0,0,0,.82);z-index:9000;
    display:flex;align-items:center;justify-content:center;padding:20px;
    backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);
    font-family:'DM Sans',sans-serif;
  }
  .b-modal-box{
    background:#141418;border:1px solid #2a2a33;border-radius:14px;
    max-width:600px;width:100%;max-height:92vh;overflow-y:auto;
    box-shadow:0 24px 80px rgba(0,0,0,.85),0 0 0 1px rgba(255,255,255,.05);
  }
  .b-modal-header{
    padding:20px 24px 18px;border-bottom:1px solid #2a2a33;
    display:flex;align-items:flex-start;justify-content:space-between;gap:12px;
    position:sticky;top:0;background:#141418;z-index:1;border-radius:14px 14px 0 0;
  }
  .b-modal-header-text{flex:1;}
  .b-modal-title{font-size:16px;font-weight:700;color:#f0f0f4;margin-bottom:4px;letter-spacing:-.01em;}
  .b-modal-subtitle{font-size:12px;color:#66667a;line-height:1.5;}
  .b-modal-close{
    background:none;border:none;font-size:16px;cursor:pointer;color:#66667a;
    width:30px;height:30px;flex-shrink:0;display:flex;align-items:center;
    justify-content:center;border-radius:6px;transition:all .14s;margin-top:1px;
  }
  .b-modal-close:hover{background:#1c1c22;color:#f0f0f4;}
  .b-modal-body{padding:20px 24px;}
  .b-modal-foot{
    padding:14px 24px 20px;border-top:1px solid #2a2a33;
    display:flex;justify-content:flex-end;gap:10px;
    background:#141418;border-radius:0 0 14px 14px;position:sticky;bottom:0;
  }
  .b-nda-doc-text{
    background:#0d0d10;border:1px solid #2a2a33;border-radius:8px;
    padding:14px 16px;font-size:12px;line-height:1.85;color:#b0b0c0;
    max-height:160px;overflow-y:auto;margin-bottom:18px;font-family:Georgia,serif;
  }
  .b-nda-doc-text h4{
    font-size:11px;font-weight:700;text-align:center;margin-bottom:10px;
    color:#f0f0f4;font-family:Georgia,serif;letter-spacing:.08em;text-transform:uppercase;
  }
  .b-nda-doc-text h5{font-size:10px;font-weight:700;margin:10px 0 3px;text-transform:uppercase;letter-spacing:.07em;color:#d0d0e0;}
  .b-nda-fields-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;}
  @media(max-width:520px){.b-nda-fields-grid{grid-template-columns:1fr;}}
  .b-sig-field{
    width:100%;background:#0d0d10;border:2px solid #2a2a33;color:#f0318a;
    border-radius:8px;padding:14px 16px;font-size:22px;font-style:italic;
    text-align:center;outline:none;font-family:Georgia,'Times New Roman',serif;
    transition:border-color .15s,box-shadow .15s;box-sizing:border-box;
  }
  .b-sig-field:focus{border-color:#f0318a;box-shadow:0 0 0 3px rgba(240,49,138,.12);}
  .b-sig-field::placeholder{color:#36363f;font-size:16px;}
  .b-sig-hint{font-size:11px;color:#66667a;margin-top:6px;line-height:1.4;}
  /* Override form inputs inside modal so box-sizing is correct */
  .b-modal-box .b-form-input,.b-modal-box .b-form-select{box-sizing:border-box;margin-bottom:0;}
  .b-agree-check{
    display:flex;align-items:flex-start;gap:10px;background:#1c1c22;
    border:1.5px solid #2a2a33;border-radius:8px;padding:13px 14px;margin-bottom:4px;
  }
  .b-agree-check input{width:15px;height:15px;margin-top:1px;accent-color:#f0318a;flex-shrink:0;cursor:pointer;}
  .b-agree-check label{font-size:12px;color:#b0b0c0;cursor:pointer;line-height:1.55;}
  .b-btn-sign{
    background:#f0318a;color:#fff;border:none;padding:11px 28px;border-radius:8px;
    font-size:14px;font-weight:700;cursor:pointer;transition:background .15s,transform .1s;
    letter-spacing:-.01em;white-space:nowrap;
  }
  .b-btn-sign:hover{background:#d4246f;transform:translateY(-1px);}
  .b-btn-sign:disabled{background:#232329;color:#66667a;cursor:not-allowed;transform:none;}
  .b-btn-cancel{
    background:none;border:1.5px solid #2a2a33;color:#b0b0c0;padding:11px 20px;
    border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;transition:all .15s;
  }
  .b-btn-cancel:hover{border-color:#3a3a46;color:#f0f0f4;}
  /* doc rows */
  .b-doc-row{display:flex;align-items:center;gap:14px;padding:14px 16px;background:var(--surface-2);border:1.5px solid var(--border);border-radius:6px;transition:border-color .15s;}
  .b-doc-row:hover{border-color:var(--border-2);}
  .b-doc-row-icon{font-size:22px;flex-shrink:0;}
  .b-doc-row-info{flex:1;min-width:0;}
  .b-doc-row-name{font-size:13px;font-weight:600;color:var(--text);margin-bottom:2px;}
  .b-doc-row-sub{font-size:11px;color:var(--text-3);}
  .b-doc-row-right{flex-shrink:0;display:flex;align-items:center;gap:8px;}
  .b-doc-badge-free{font-size:10px;font-weight:700;background:var(--green-bg);border:1px solid var(--green-border);color:var(--green);padding:2px 8px;border-radius:4px;}
  .b-doc-badge-nda{font-size:10px;font-weight:700;background:var(--amber-bg);border:1px solid var(--amber-border);color:var(--amber);padding:2px 8px;border-radius:4px;display:inline-flex;align-items:center;gap:3px;}
  .b-doc-btn{background:none;border:1.5px solid var(--border);color:var(--text-2);padding:5px 12px;border-radius:5px;font-size:12px;font-weight:600;cursor:pointer;transition:all .14s;white-space:nowrap;}
  .b-doc-btn:hover{border-color:var(--pink);color:var(--pink);}
  .b-doc-btn.locked{color:var(--amber);border-color:var(--amber-border);}
  .b-doc-btn.locked:hover{background:var(--amber-bg);}

  @media(max-width:900px){
    .biz-grid{grid-template-columns:1fr;}
    .biz-side{position:static;}
    .b-metrics{grid-template-columns:1fr 1fr;}
    .b-met:nth-child(2){border-right:none;}
    .b-met:nth-child(3){border-top:1px solid var(--border);}
    .b-met:nth-child(4){border-top:1px solid var(--border);}
    .b-met:nth-child(5){border-top:1px solid var(--border);border-right:none;}
    .b-ops-grid{grid-template-columns:1fr;}
    .b-hl-row{grid-template-columns:1fr 1fr;}
    .b-loc-grid{grid-template-columns:1fr;}
    .b-sim-grid{grid-template-columns:1fr;}
    .b-form-row-2{grid-template-columns:1fr;}
  }
`;

const BusinessListingDetail = ({
  product,
  getAttr,
  parseMoney,
  isPositiveMoney,
  currency,
  isDealClosed,
  contactingAgent,
  handleContactAgent,
  handleShareClick,
  wishlistProducts,
  setWishlistProducts,
  user,
  cookies,
  allProducts,
  productId,
  reviews,
  activeVisit,
  respondToVendorReschedule,
  setDisputeModalOpen,
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("overview");
  const [activeImage, setActiveImage] = useState(
    product.image1 || product.image2 || product.image3 || product.image4 || ""
  );
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [wishlistBusy, setWishlistBusy] = useState(false);

  // NDA gating — auto-unlock when returning from Square payment
  const lockEbitda = !!product.nda_lock_ebitda;
  const lockFinancials = !!product.nda_lock_full_financials;

  // Parse the vendor's declared NDA document list
  const NDA_DOC_MAP = {
    pl_statement:       { icon: "📈", label: "P&L Statement (3yr)" },
    tax_returns:        { icon: "🧾", label: "Tax Returns (3yr)" },
    revenue_breakdown:  { icon: "💰", label: "Revenue Breakdown" },
    cim:                { icon: "📊", label: "CIM / Info Memo" },
    bank_statements:    { icon: "🏦", label: "Bank Statements" },
    lease_agreement:    { icon: "📋", label: "Lease Agreement" },
    franchise_agreement:{ icon: "🤝", label: "Franchise Agreement" },
    asset_list:         { icon: "🏭", label: "Asset List" },
  };
  const ndaDocIds = (product.nda_available_docs || "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s && NDA_DOC_MAP[s]);
  const ndaDocList = ndaDocIds.map((id) => ({ id, ...NDA_DOC_MAP[id] }));
  // ndaStatus: null | "pending_payment" | "pending_vendor" | "accepted" | "rejected" | "disputed"
  const [ndaStatus, setNdaStatus] = useState(null);
  // ndaSigned = true means NDA paid + accepted (instant unlock)
  const [ndaSigned, setNdaSigned] = useState(false);
  const [listingDocuments, setListingDocuments] = useState([]);
  const [ndaModalOpen, setNdaModalOpen] = useState(false);
  const [ndaForm, setNdaForm] = useState({ name: "", email: "", company: "", role: "", signature: "", agreed: false });
  const [ndaSubmitting, setNdaSubmitting] = useState(false);
  // Inline error shown inside the modal so it is always visible
  const [ndaError, setNdaError] = useState("");

  const isListingOwner = useMemo(() => {
    const ue = user?.email?.trim().toLowerCase();
    const ve = product?.vendor?.email?.trim().toLowerCase();
    return Boolean(ue && ve && ue === ve);
  }, [user?.email, product?.vendor?.email]);

  const financialsUnlocked = ndaSigned || isListingOwner;

  const cannotStartNewNda =
    ndaSigned ||
    ndaStatus === "pending_vendor" ||
    ndaStatus === "disputed" ||
    ndaStatus === "pending_payment";

  useEffect(() => {
    if (!isListingOwner) return;
    setNdaSigned(false);
    setNdaStatus(null);
  }, [isListingOwner]);

  const fetchListingDocuments = useCallback(async () => {
    const pid = product?.id ?? productId;
    if (!pid || isListingOwner) return;
    const raw = cookies?.access_token;
    const token = typeof raw === "string" ? raw.replace(/"/g, "") : "";
    if (!token) return;
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/api/nda/product/${pid}/listing-documents/buyer/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setListingDocuments(Array.isArray(res.data) ? res.data : []);
    } catch {
      setListingDocuments([]);
    }
  }, [product?.id, productId, cookies?.access_token, isListingOwner]);

  const refreshNdaState = useCallback(async () => {
    const pid = product?.id ?? productId;
    if (!pid || isListingOwner) return;
    const raw = cookies?.access_token;
    const token = typeof raw === "string" ? raw.replace(/"/g, "") : "";
    if (!token || !user?.id) return;

    try {
      const res = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/nda/mine/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const mine = Array.isArray(res.data) ? res.data : [];
      const row = mine.find((n) => String(n.product_id) === String(pid));
      if (!row) return;
      if (row.status === "accepted") {
        setNdaSigned(true);
        setNdaStatus(null);
        const docs = row.listing_documents?.length
          ? row.listing_documents
          : row.documents || [];
        if (docs.length) setListingDocuments(docs);
        else fetchListingDocuments();
      } else if (row.status === "pending_vendor" || row.status === "disputed") {
        setNdaSigned(false);
        setNdaStatus(row.status);
      } else if (row.status === "rejected") {
        setNdaSigned(false);
        setNdaStatus(null);
      }
    } catch {
      /* ignore */
    }
  }, [product?.id, productId, user?.id, cookies?.access_token, isListingOwner, fetchListingDocuments]);

  useEffect(() => {
    refreshNdaState();
  }, [refreshNdaState]);

  // After Square checkout return (?nda_unlocked=1), poll until payment confirms
  useEffect(() => {
    if (searchParams.get("nda_unlocked") !== "1" || isListingOwner) return;
    const ndaId = searchParams.get("nda_id");
    let cancelled = false;
    let attempts = 0;

    const poll = async () => {
      attempts += 1;
      if (ndaId) {
        try {
          const res = await axios.get(
            `${import.meta.env.VITE_SERVER_URL}/api/nda/status/${ndaId}/`
          );
          if (cancelled) return;
          if (res.data?.status === "accepted") {
            setNdaSigned(true);
            setNdaStatus(null);
            if (res.data.listing_documents?.length) {
              setListingDocuments(res.data.listing_documents);
            } else {
              fetchListingDocuments();
            }
            return;
          }
        } catch {
          /* keep polling */
        }
      }
      if (attempts < 24) {
        setTimeout(poll, 2500);
      }
      refreshNdaState();
    };

    poll();
    return () => {
      cancelled = true;
    };
  }, [
    searchParams,
    isListingOwner,
    fetchListingDocuments,
    refreshNdaState,
  ]);

  const openNdaModal = () => {
  const accessToken = useAccessToken();
    if (isListingOwner || cannotStartNewNda) return;
    setNdaError("");
    setNdaModalOpen(true);
  };

  const handleSignNda = async () => {
    setNdaError("");
    const { name, email, role, signature, agreed } = ndaForm;

    if (isListingOwner) {
      setNdaError("You cannot sign an NDA on your own listing.");
      return;
    }
    if (cannotStartNewNda) {
      setNdaError("You already have an NDA request in progress for this listing.");
      return;
    }

    // Inline validation — shown inside the modal, not as a hidden toast
    if (!name || !email || !role || !signature || !agreed) {
      setNdaError("Please fill in all required fields and check the agreement box.");
      return;
    }
    if (signature.trim().toLowerCase() !== name.trim().toLowerCase()) {
      setNdaError("Your digital signature must match your Full Legal Name exactly.");
      return;
    }
    if (!user?.id) {
      setNdaError("You must be signed in to submit an NDA. Please log in and try again.");
      return;
    }

    setNdaSubmitting(true);
    try {
      const payload = {
        customer_id: user.id,
        product_id: productId,
        full_name: name,
        email,
        company: ndaForm.company || "",
        buyer_role: role,
        signature,
        agreed_to_terms: agreed,
      };
      const res = await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/nda/sign/`, payload);
      const { payment_url, detail, status: ndaStatusResp } = res.data;

      if (detail === "Payment pending.") {
        setNdaStatus("pending_payment");
        setNdaModalOpen(false);
        toast.info("Complete payment in the checkout tab to finish your NDA request.", { position: "top-right" });
        return;
      }

      // Already accepted (documents available)
      if (detail === "already_signed") {
        setNdaSigned(true);
        setNdaStatus(null);
        setNdaModalOpen(false);
        fetchListingDocuments();
        toast.success("✅ NDA complete — financial documents are unlocked.", { position: "top-right" });
        return;
      }

      // Pending review — already paid, awaiting vendor, or Square temporarily down
      if (detail === "pending_review") {
        const st = ndaStatusResp || "pending_vendor";
        setNdaModalOpen(false);
        setNdaError("");
        if (st === "accepted") {
          setNdaSigned(true);
          setNdaStatus(null);
          fetchListingDocuments();
          toast.success("✅ NDA complete — financial documents are unlocked.", { position: "top-right" });
        } else {
          setNdaStatus(st);
          toast.info("Your NDA is being processed. Check My NDA Dashboard for status.", { position: "top-right" });
        }
        return;
      }

      // Redirect to Square checkout for the $1 NDA fee
      if (payment_url) {
        setNdaError("");
        toast.info("Redirecting to secure payment…", { position: "top-right" });
        window.open(payment_url, "_blank", "noopener");
        return;
      }

      setNdaError("Could not generate a payment link. Please try again in a moment.");
    } catch (err) {
      const data = err?.response?.data || {};
      // Extract the most meaningful error message from any field
      const msg =
        data.detail ||
        data.customer_id?.[0] ||
        data.product_id?.[0] ||
        data.buyer_role?.[0] ||
        data.full_name?.[0] ||
        data.signature?.[0] ||
        data.agreed_to_terms?.[0] ||
        data.non_field_errors?.[0] ||
        (err?.message === "Network Error" ? "Network error — please check your connection and try again." : "") ||
        "Something went wrong. Please try again.";
      setNdaError(msg);
    } finally {
      setNdaSubmitting(false);
    }
  };

  const photos = [product.image1, product.image2, product.image3, product.image4].filter(Boolean);
  const daysOnMarket = product.created_at ? formatDistanceToNow(new Date(product.created_at)) : null;

  const revenue = getAttr("annual revenue", "revenue", "revenue ($)", "annual_revenue");
  const ebitda = getAttr("ebitda", "ebitda ($)", "normalized ebitda", "adjusted ebitda", "sde", "sde ($)");
  const ebitdaMultiple = getAttr("ebitda multiple", "revenue multiple", "sde multiple");
  const yearsOp = getAttr("years in operation", "years operating");
  const employees = getAttr("employees");
  const ownerInvolvement = getAttr("owner involvement");
  const transitionType = getAttr("transition type", "transition support");
  const financing = getAttr("financing options");
  const remote = getAttr("remote business", "remote");
  const litigation = getAttr("pending litigation");
  const aiLeverage = getAttr("ai leverageable", "ai-enabled operations", "ai-enabled");
  const sopsDocumented = getAttr("sops documented", "documented sops", "sops");
  const crmInPlace = getAttr("crm/erp in place", "crm/erp");
  const expansion = getAttr("expansion opportunity", "expansion");
  const licenses = getAttr("licenses required");
  const saleType = getAttr("sale type");
  const inventory = getAttr("inventory");
  const ffe = getAttr("ff&e", "ffe", "fixtures & equipment");
  const leaseRemaining = getAttr("lease remaining", "lease term");
  const monthlyRent = getAttr("monthly rent", "rent");
  const city = getAttr("city") || product.vendor?.city || "";
  const state = getAttr("state") || product.vendor?.state || "";
  const zip = getAttr("zip", "zip_code", "zip / radius") || "";
  const country = getAttr("country") || product.vendor?.country || "";
  const street = getAttr("address", "street address", "street") || "";
  const smartFeaturesRaw = getAttr("smart features", "smart match") || "";
  const smartFeatures = smartFeaturesRaw.split(",").map((s) => s.trim()).filter(Boolean);
  const staffRoles = getAttr("staff roles");
  const techStack = getAttr("technology stack");
  const keyVendors = getAttr("key vendors");
  const locationDetails = getAttr("location details", "location");
  const franchiseName = getAttr("franchise name", "franchise");
  const industry = product.subcategory?.name || getAttr("industry", "sector");

  const yes = (v) => { const s = String(v || "").toLowerCase(); return s === "true" || s === "yes"; };
  const no = (v) => { const s = String(v || "").toLowerCase(); return s === "false" || s === "no"; };

  const price = Number(product.unit_price) || 0;
  const formattedPrice = price ? `${currency}${formatMoney(price)}` : "Contact for Price";

  // ── Optimistic wishlist toggle ──
  const isSaved = !!wishlistProducts?.find((i) => i.id === product.id);

  const handleWishlistClick = useCallback(async () => {
    if (!accessToken) {
      toast.error("Please sign in to save listings", { position: "top-right" });
      sessionStorage.setItem("redirectAfterLogin", window.location.href);
      navigate("/signin");
      return;
    }
    if (wishlistBusy) return;
    setWishlistBusy(true);

    // Optimistically update UI immediately
    const wasInWishlist = isSaved;
    if (wasInWishlist) {
      setWishlistProducts((prev) => prev.filter((i) => i.id !== product.id));
    } else {
      setWishlistProducts((prev) => [...(prev || []), { id: product.id, ...product }]);
    }

    try {
      const url = wasInWishlist
        ? `${import.meta.env.VITE_SERVER_URL}/api/customer/wishlist/remove/${product.id}`
        : `${import.meta.env.VITE_SERVER_URL}/api/customer/wishlist/add/${product.id}`;
      await axios.post(url, {}, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      toast.success(wasInWishlist ? "Removed from wishlist" : "Saved to wishlist", { position: "top-right" });
    } catch (err) {
      // Revert on failure
      if (wasInWishlist) {
        setWishlistProducts((prev) => [...(prev || []), { id: product.id, ...product }]);
      } else {
        setWishlistProducts((prev) => (prev || []).filter((i) => i.id !== product.id));
      }
      const msg = err?.response?.data?.detail || err?.response?.data?.message || "Couldn't update wishlist";
      toast.error(msg, { position: "top-right" });
    } finally {
      setWishlistBusy(false);
    }
  }, [user, wishlistBusy, isSaved, product, cookies, navigate, setWishlistProducts]);

  const tabs = ["overview", "financials", "operations", "location", "documents"];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="biz-root">
        <div className="biz-page">
          {/* Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-3)", marginBottom: 20 }}>
            <Link to="/" style={{ color: "var(--text-3)" }}>Home</Link>
            <span>›</span>
            <Link to={`/category/${product.category?.slug}`} style={{ color: "var(--text-3)" }}>Business for Sale</Link>
            {industry && <><span>›</span><span style={{ color: "var(--text-2)" }}>{industry}</span></>}
            <span>›</span>
            <span style={{ color: "var(--text)", fontWeight: 600 }}>{product.name}</span>
          </div>

          <div className="biz-grid">
            {/* ════ MAIN ════ */}
            <div className="biz-main">

              {/* PHOTO GALLERY */}
              <div className="b-gallery">
                <div className="b-gallery-main" style={{ cursor: photos.length > 0 ? "zoom-in" : "default" }} onClick={() => { if (photos.length > 0) { setLightboxIndex(photos.indexOf(activeImage) >= 0 ? photos.indexOf(activeImage) : 0); setLightboxOpen(true); } }}>
                  {activeImage ? (
                    <img src={activeImage} alt={product.name} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, background: "var(--surface-3)", color: "var(--text-3)", fontSize: 48 }}>
                      💼
                      <p style={{ fontSize: 13 }}>No photo available</p>
                    </div>
                  )}
                  <div className="b-gallery-badge">
                    {industry && <span className="b-badge ind">{industry}</span>}
                    {isDealClosed
                      ? <span className="b-badge closed">● Closed</span>
                      : <span className="b-badge active-s">● Active</span>}
                    {product.origin && (
                      <span className="b-badge" style={{ background: "var(--blue-bg)", borderColor: "var(--blue-border)", color: "var(--blue)" }}>
                        {product.origin === "ai_built" ? "🤖 AI-Built" : product.origin === "ai_built_verified" ? "✅ AI Verified" : product.origin === "hybrid" ? "⚡ Hybrid" : "👤 Human-Built"}
                      </span>
                    )}
                  </div>
                  <div className="b-gallery-price">
                    <div className="b-asking-label">Asking Price</div>
                    <div className="b-asking-val">{formattedPrice}</div>
                  </div>
                </div>
                {photos.length > 0 && (
                  <div className="b-thumbs">
                    {photos.map((src, i) => (
                      <div
                        key={i}
                        className={`b-thumb${activeImage === src ? " active" : ""}`}
                        onClick={() => setActiveImage(src)}
                      >
                        <img src={src} alt={`View ${i + 1}`} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* DEAL HERO */}
              <div className="b-hero">
                <div className="b-hero-head">
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                    {industry && <span className="b-badge ind">{industry}</span>}
                    {saleType && <span className="b-badge">{saleType}</span>}
                    {yes(getAttr("sba eligible", "sba-eligible")) && <span className="b-badge sba">SBA-Eligible</span>}
                    {financing && <span className="b-badge" style={{ background: "var(--green-bg)", borderColor: "var(--green-border)", color: "var(--green)" }}>{financing}</span>}
                    {isDealClosed && <span className="b-badge closed">Deal Closed</span>}
                  </div>
                  <h1 className="b-hero-title">{product.name}</h1>
                  {(city || state || street) && (
                    <div className="b-hero-loc">
                      📍
                      <span>
                        {[street, city, state, zip].filter(Boolean).join(", ")}
                      </span>
                    </div>
                  )}
                </div>

                {/* Metrics strip */}
                <div className="b-metrics">
                  <div className="b-met">
                    <div className="b-met-v pink">{formattedPrice}</div>
                    <div className="b-met-k">Asking Price</div>
                    {inventory && <div className="b-met-note">+ Inv. ~{inventory}</div>}
                  </div>
                  {isPositiveMoney(revenue) && (
                    <div className="b-met">
                      <div className="b-met-v">{currency}{formatMoney(parseMoney(revenue))}</div>
                      <div className="b-met-k">Annual Revenue</div>
                    </div>
                  )}
                  {lockEbitda && !financialsUnlocked ? (
                    <div className="b-met" style={{ cursor: "pointer" }} onClick={() => openNdaModal()} title="Sign NDA to reveal">
                      <div className="b-met-v amber" style={{ fontSize: 14 }}>🔒 NDA</div>
                      <div className="b-met-k">SDE / EBITDA</div>
                      <div className="b-met-note" style={{ color: "var(--amber)" }}>Tap to unlock</div>
                    </div>
                  ) : isPositiveMoney(ebitda) && (
                    <div className="b-met">
                      <div className="b-met-v green">{currency}{formatMoney(parseMoney(ebitda))}</div>
                      <div className="b-met-k">SDE / EBITDA</div>
                    </div>
                  )}
                  {ebitdaMultiple && (
                    <div className="b-met">
                      <div className="b-met-v amber">{ebitdaMultiple}x</div>
                      <div className="b-met-k">SDE Multiple</div>
                    </div>
                  )}
                  {yearsOp && (
                    <div className="b-met">
                      <div className="b-met-v">{yearsOp} yrs</div>
                      <div className="b-met-k">Years Operating</div>
                    </div>
                  )}
                  {!isPositiveMoney(revenue) && !ebitdaMultiple && (
                    <div className="b-met">
                      <div className="b-met-v">{employees || "—"}</div>
                      <div className="b-met-k">Employees</div>
                    </div>
                  )}
                  {!isPositiveMoney(ebitda) && !yearsOp && (
                    <div className="b-met">
                      <div className="b-met-v">{daysOnMarket || "—"}</div>
                      <div className="b-met-k">On Market</div>
                    </div>
                  )}
                </div>
              </div>

              {/* TABS */}
              <div>
                <div style={{ display: "flex", background: "var(--surface)", border: "1.5px solid var(--border)", borderBottom: "none", borderRadius: "8px 8px 0 0", overflow: "hidden" }}>
                  {tabs.map((t) => (
                    <button
                      key={t}
                      className={`b-tab${activeTab === t ? " active" : ""}`}
                      onClick={() => setActiveTab(t)}
                      style={{ textTransform: "capitalize" }}
                    >
                      {t === "overview" ? "Overview" : t === "financials" ? "Financials" : t === "operations" ? "Operations" : t === "location" ? "Location" : "All Info"}
                    </button>
                  ))}
                </div>

                {/* ── OVERVIEW ── */}
                {activeTab === "overview" && (
                  <div className="b-panel">
                    <h3>About This Business</h3>
                    {(product.short_description || product.description) ? (
                      <div className="b-about">
                        {parse(product.short_description || product.description || "")}
                      </div>
                    ) : (
                      <p style={{ fontSize: 13, color: "var(--text-3)", fontStyle: "italic" }}>No description provided.</p>
                    )}

                    {(staffRoles || techStack || keyVendors) && (
                      <>
                        <hr className="b-divider" />
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                          {staffRoles && (
                            <div className="b-ops-card">
                              <h4>Staff & Roles</h4>
                              <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6 }}>{staffRoles}</div>
                            </div>
                          )}
                          {techStack && (
                            <div className="b-ops-card">
                              <h4>Tech Stack</h4>
                              <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6 }}>{techStack}</div>
                            </div>
                          )}
                          {keyVendors && (
                            <div className="b-ops-card">
                              <h4>Key Vendors</h4>
                              <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6 }}>{keyVendors}</div>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {smartFeatures.length > 0 && (
                      <>
                        <hr className="b-divider" />
                        <h3>Smart Match Tags</h3>
                        <div>
                          {smartFeatures.map((tag) => (
                            <span key={tag} className="b-smart-tag">✦ {tag}</span>
                          ))}
                        </div>
                      </>
                    )}

                    <hr className="b-divider" />
                    <h3>Activity</h3>
                    <div>
                      <div className="b-state-msg active-s">
                        <span>✔</span>
                        <div>
                          <div className="b-sm-text">
                            {isDealClosed ? "This listing is closed" : "Listing live and active on PinkSurfing marketplace"}
                          </div>
                          {daysOnMarket && <div className="b-sm-ts">Listed {daysOnMarket} ago</div>}
                        </div>
                      </div>
                      <div className="b-state-msg info">
                        <span><span className="b-pulse" /></span>
                        <div>
                          <div className="b-sm-text">Buyers are actively reviewing this listing</div>
                          <div className="b-sm-ts">Interest tracking · Real-time updates</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── FINANCIALS ── */}
                {activeTab === "financials" && (
                  <div className="b-panel">
                    <h3>Financial Summary</h3>
                    <table className="b-fin-table">
                      <thead>
                        <tr><th>Metric</th><th>Value</th></tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Asking Price</td>
                          <td style={{ color: "var(--pink)", fontWeight: 700 }}>{formattedPrice}</td>
                        </tr>
                        {isPositiveMoney(revenue) && (
                          <tr>
                            <td>Annual Revenue</td>
                            <td className="pos">{currency}{formatMoney(parseMoney(revenue))}</td>
                          </tr>
                        )}
                        {/* EBITDA — shown only if not locked or NDA signed */}
                        {(!lockEbitda || financialsUnlocked) && isPositiveMoney(ebitda) && (
                          <tr className="highlight">
                            <td>SDE / EBITDA</td>
                            <td>{currency}{formatMoney(parseMoney(ebitda))}</td>
                          </tr>
                        )}
                        {lockEbitda && !financialsUnlocked && (
                          <tr>
                            <td>SDE / EBITDA</td>
                            <td>
                              <button
                                onClick={() => openNdaModal()}
                                style={{ background: "none", border: "none", color: "var(--amber)", fontWeight: 700, cursor: "pointer", fontSize: 13, fontFamily: "inherit", padding: 0, display: "flex", alignItems: "center", gap: 5 }}
                              >
                                🔒 Sign NDA to reveal
                              </button>
                            </td>
                          </tr>
                        )}
                        {(!lockEbitda || financialsUnlocked) && ebitdaMultiple && (
                          <tr>
                            <td>Multiple</td>
                            <td>{ebitdaMultiple}x</td>
                          </tr>
                        )}
                        {inventory && <tr><td>Inventory (est.)</td><td>{inventory}</td></tr>}
                        {ffe && <tr><td>FF&amp;E</td><td>{ffe}</td></tr>}
                        {financing && <tr><td>Seller Financing</td><td className="pos">{financing}</td></tr>}
                      </tbody>
                    </table>

                    {/* NDA gate for full financials */}
                    {(lockEbitda || lockFinancials) && !financialsUnlocked ? (
                      <div className="b-nda-gate">
                        <div className="b-nda-gate-icon">🔒</div>
                        <h4>
                          {lockEbitda && lockFinancials
                            ? "EBITDA & Full Financials Require NDA"
                            : lockEbitda
                            ? "EBITDA / SDE Requires NDA"
                            : "Full Financial Details Require NDA"}
                        </h4>
                        <p>
                          {lockEbitda && lockFinancials
                            ? "The seller has chosen to protect EBITDA/SDE and the full financial breakdown. Sign the NDA to unlock both instantly."
                            : lockEbitda
                            ? "The seller has locked the SDE / EBITDA figure. Sign the NDA to view it instantly."
                            : "Full revenue breakdown, P&L, and supporting documents are protected. Sign the NDA to unlock instantly."}
                        </p>
                        <div className="b-nda-chips">
                          {lockEbitda && <span className="b-nda-chip">📊 SDE / EBITDA</span>}
                          {ndaDocList.length > 0
                            ? ndaDocList.map((doc) => (
                                <span key={doc.id} className="b-nda-chip">{doc.icon} {doc.label}</span>
                              ))
                            : /* fallback when vendor hasn't specified docs yet */
                              lockFinancials && (
                                <>
                                  <span className="b-nda-chip">💰 Revenue Breakdown</span>
                                  <span className="b-nda-chip">📈 Full P&amp;L</span>
                                  <span className="b-nda-chip">🧾 Tax Returns (3yr)</span>
                                </>
                              )
                          }
                        </div>
                        {ndaStatus ? (
                          <button className="b-btn-nda" style={{ opacity: 0.6, cursor: "default" }} disabled>
                            {ndaStatus === "pending_vendor"
                              ? "⏳ Awaiting Seller Review"
                              : ndaStatus === "disputed"
                              ? "⚠️ Dispute in progress"
                              : ndaStatus === "pending_payment"
                              ? "💳 Complete payment to continue"
                              : "✍ NDA Submitted"}
                          </button>
                        ) : (
                          <button className="b-btn-nda" onClick={() => openNdaModal()}>
                            ✍ Sign NDA to Unlock
                          </button>
                        )}
                      </div>
                    ) : isListingOwner ? (
                      <div style={{ marginTop: 16, padding: 14, background: "var(--surface-2)", border: "1.5px solid var(--border)", borderRadius: 6, fontSize: 12, color: "var(--text-3)", lineHeight: 1.6 }}>
                        This is your listing. Buyers unlock protected financials after they complete the NDA.
                      </div>
                    ) : ndaSigned ? (
                      <div style={{ marginTop: 16, padding: 14, background: "var(--green-bg)", border: "1.5px solid var(--green-border)", borderRadius: 6, fontSize: 12, color: "var(--green)", lineHeight: 1.6 }}>
                        ✅ <strong>NDA Complete</strong> — Financial documents are unlocked.
                        {listingDocuments.length > 0 ? " Open the Documents tab or " : " "}
                        <a href="/my-ndas" style={{ color: "var(--green)", fontWeight: 700 }}>My NDA Dashboard →</a>
                      </div>
                    ) : ndaStatus === "pending_vendor" ? (
                      <div style={{ marginTop: 16, padding: 14, background: "rgba(251,191,36,.08)", border: "1.5px solid rgba(251,191,36,.3)", borderRadius: 6, fontSize: 12, color: "#fbbf24", lineHeight: 1.6 }}>
                        ⏳ <strong>Processing</strong> — Your payment is confirmed. Documents will unlock shortly. <a href="/my-ndas" style={{ color: "#fbbf24", fontWeight: 700 }}>Track status →</a>
                      </div>
                    ) : ndaStatus === "disputed" ? (
                      <div style={{ marginTop: 16, padding: 14, background: "rgba(248,113,113,.08)", border: "1.5px solid rgba(248,113,113,.35)", borderRadius: 6, fontSize: 12, color: "#f87171", lineHeight: 1.6 }}>
                        ⚠️ <strong>Dispute recorded</strong> — Follow progress in <a href="/my-ndas" style={{ color: "#f87171", fontWeight: 700 }}>My NDAs</a>.
                      </div>
                    ) : ndaStatus === "pending_payment" ? (
                      <div style={{ marginTop: 16, padding: 14, background: "rgba(59,130,246,.08)", border: "1.5px solid rgba(59,130,246,.35)", borderRadius: 6, fontSize: 12, color: "#60a5fa", lineHeight: 1.6 }}>
                        💳 <strong>Payment pending</strong> — Finish checkout to submit your NDA. You can close this page and return after paying.
                      </div>
                    ) : (
                      <div style={{ marginTop: 16, padding: 14, background: "var(--surface-2)", border: "1.5px solid var(--border)", borderRadius: 6, fontSize: 12, color: "var(--text-3)", lineHeight: 1.6 }}>
                        📋 For full financial details including tax returns and full P&amp;L, contact the lister using the form below.
                      </div>
                    )}
                  </div>
                )}

                {/* ── OPERATIONS ── */}
                {activeTab === "operations" && (
                  <div className="b-panel">
                    <div className="b-ops-grid">
                      <div className="b-ops-card">
                        <h4>Business Details</h4>
                        <div>
                          {saleType && <div className="b-ops-row"><span className="b-ops-key">Sale Type</span><span className="b-ops-val">{saleType}</span></div>}
                          {yearsOp && <div className="b-ops-row"><span className="b-ops-key">Years Operating</span><span className="b-ops-val">{yearsOp} years</span></div>}
                          {ownerInvolvement && <div className="b-ops-row"><span className="b-ops-key">Owner Involvement</span><span className="b-ops-val">{ownerInvolvement}</span></div>}
                          {employees && <div className="b-ops-row"><span className="b-ops-key">Team Size</span><span className="b-ops-val">{employees} employees</span></div>}
                          {transitionType && <div className="b-ops-row"><span className="b-ops-key">Transition Support</span><span className="b-ops-val">{transitionType}</span></div>}
                          {leaseRemaining && <div className="b-ops-row"><span className="b-ops-key">Lease Remaining</span><span className="b-ops-val">{leaseRemaining}</span></div>}
                          {licenses && <div className="b-ops-row"><span className="b-ops-key">Licenses Required</span><span className="b-ops-val">{licenses}</span></div>}
                          {franchiseName && <div className="b-ops-row"><span className="b-ops-key">Franchise</span><span className="b-ops-val">{franchiseName}</span></div>}
                        </div>
                      </div>
                      <div className="b-ops-card">
                        <h4>Financing & Deal</h4>
                        <div>
                          <div className="b-ops-row"><span className="b-ops-key">Asking Price</span><span className="b-ops-val" style={{ color: "var(--pink)" }}>{formattedPrice}</span></div>
                          {inventory && <div className="b-ops-row"><span className="b-ops-key">Inventory (est.)</span><span className="b-ops-val">{inventory}</span></div>}
                          {ffe && <div className="b-ops-row"><span className="b-ops-key">FF&E Included</span><span className="b-ops-val">{ffe}</span></div>}
                          {financing && <div className="b-ops-row"><span className="b-ops-key">Seller Financing</span><span className="b-ops-val" style={{ color: "var(--green)" }}>{financing}</span></div>}
                          {monthlyRent && <div className="b-ops-row"><span className="b-ops-key">Monthly Rent</span><span className="b-ops-val">{monthlyRent}</span></div>}
                        </div>
                      </div>
                    </div>

                    <hr className="b-divider" />
                    <h4>Operational Capabilities</h4>
                    <div className="b-flag-wrap">
                      {(yes(sopsDocumented) || no(sopsDocumented)) && (
                        <div className={`b-flag ${yes(sopsDocumented) ? "yes" : "no"}`}>
                          📋 Documented SOPs: {yes(sopsDocumented) ? "Yes" : "No"}
                        </div>
                      )}
                      {(yes(crmInPlace) || no(crmInPlace)) && (
                        <div className={`b-flag ${yes(crmInPlace) ? "yes" : "no"}`}>
                          🗂️ CRM / ERP: {yes(crmInPlace) ? "In Place" : "None"}
                        </div>
                      )}
                      {(yes(remote) || no(remote)) && (
                        <div className={`b-flag ${yes(remote) ? "yes" : "no"}`}>
                          🌐 Remote-Friendly: {yes(remote) ? "Yes" : "No"}
                        </div>
                      )}
                      {(yes(aiLeverage) || no(aiLeverage)) && (
                        <div className={`b-flag ${yes(aiLeverage) ? "yes" : "no"}`}>
                          🤖 AI-Leverageable: {yes(aiLeverage) ? "Yes" : "No"}
                        </div>
                      )}
                      {(yes(expansion) || no(expansion)) && (
                        <div className={`b-flag ${yes(expansion) ? "yes" : "no"}`}>
                          🚀 Expansion Opportunity: {yes(expansion) ? "Yes" : "No"}
                        </div>
                      )}
                    </div>

                    {litigation && (
                      <>
                        <hr className="b-divider" />
                        <h4>Risk Disclosures</h4>
                        <div className="b-flag-wrap">
                          <div className={`b-flag ${String(litigation).toLowerCase() === "none" ? "no" : "warn"}`}>
                            ⚖️ Pending Litigation: {litigation}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* ── LOCATION ── */}
                {activeTab === "location" && (
                  <div className="b-panel">
                    <div className="b-map-ph">
                      <div style={{ fontSize: 36 }}>🗺️</div>
                      <div>{[street, city, state, zip].filter(Boolean).join(", ") || "Location details available after contact"}</div>
                      <div style={{ fontSize: 11 }}>Map integration — connect your Maps API</div>
                    </div>
                    <div className="b-loc-grid">
                      {street && (
                        <div className="b-loc-item">
                          <div className="b-loc-label">Street Address</div>
                          <div className="b-loc-val">{street}</div>
                        </div>
                      )}
                      {city && (
                        <div className="b-loc-item">
                          <div className="b-loc-label">City</div>
                          <div className="b-loc-val">{city}{state ? `, ${state}` : ""}{zip ? ` ${zip}` : ""}</div>
                        </div>
                      )}
                      {country && (
                        <div className="b-loc-item">
                          <div className="b-loc-label">Country</div>
                          <div className="b-loc-val">{country}</div>
                        </div>
                      )}
                      {monthlyRent && (
                        <div className="b-loc-item">
                          <div className="b-loc-label">Monthly Rent</div>
                          <div className="b-loc-val">{monthlyRent}</div>
                        </div>
                      )}
                      {leaseRemaining && (
                        <div className="b-loc-item">
                          <div className="b-loc-label">Lease Term Remaining</div>
                          <div className="b-loc-val">{leaseRemaining}</div>
                        </div>
                      )}
                      {locationDetails && (
                        <div className="b-loc-item" style={{ gridColumn: "1 / -1" }}>
                          <div className="b-loc-label">Location Details</div>
                          <div className="b-loc-val">{locationDetails}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── DOCUMENTS ── */}
                {activeTab === "documents" && !financialsUnlocked && (lockEbitda || lockFinancials) && (
                  <div className="b-panel" style={{ paddingBottom: 0, borderRadius: "0 0 0 0", borderBottom: "none" }}>
                    <h3 style={{ marginBottom: 14 }}>Documents</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                      {/* Free document */}
                      <div className="b-doc-row">
                        <div className="b-doc-row-icon">📄</div>
                        <div className="b-doc-row-info">
                          <div className="b-doc-row-name">Business Teaser</div>
                          <div className="b-doc-row-sub">High-level overview · Visible to all buyers · No NDA required</div>
                        </div>
                        <div className="b-doc-row-right">
                          <span className="b-doc-badge-free">Free Access</span>
                          <button className="b-doc-btn" onClick={() => toast.info("📄 Teaser download — contact lister for file.", { position: "top-right" })}>Download</button>
                        </div>
                      </div>
                      {/* NDA-gated docs — real list from vendor */}
                      {ndaDocList.length > 0
                        ? ndaDocList.map((doc) => (
                          <div className="b-doc-row" key={doc.id}>
                            <div className="b-doc-row-icon">{doc.icon}</div>
                            <div className="b-doc-row-info">
                              <div className="b-doc-row-name">{doc.label}</div>
                              <div className="b-doc-row-sub">Protected — sign the NDA to unlock instantly</div>
                            </div>
                            <div className="b-doc-row-right">
                              <span className="b-doc-badge-nda">🔒 NDA Required</span>
                              <button className="b-doc-btn locked" onClick={() => openNdaModal()}>✍ Sign NDA</button>
                            </div>
                          </div>
                        ))
                        : /* fallback when vendor hasn't specified docs */
                          (lockEbitda || lockFinancials) && (
                          <div className="b-doc-row">
                            <div className="b-doc-row-icon">🔒</div>
                            <div className="b-doc-row-info">
                              <div className="b-doc-row-name">Financial Documents</div>
                              <div className="b-doc-row-sub">Seller has protected financial documents — sign the NDA to access them</div>
                            </div>
                            <div className="b-doc-row-right">
                              <span className="b-doc-badge-nda">🔒 NDA Required</span>
                              <button className="b-doc-btn locked" onClick={() => openNdaModal()}>✍ Sign NDA</button>
                            </div>
                          </div>
                        )
                      }
                    </div>
                    <div style={{ marginBottom: 20, padding: 12, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 11, color: "var(--text-3)" }}>
                      🤖 AI agents cannot sign NDAs. Human signing authority required.
                    </div>
                  </div>
                )}

                {activeTab === "documents" && financialsUnlocked && (lockEbitda || lockFinancials) && (
                  <div className="b-panel" style={{ paddingBottom: 0, borderRadius: "0 0 0 0", borderBottom: "none" }}>
                    <h3 style={{ marginBottom: 14 }}>Documents</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                      {/* Business Teaser is always free */}
                      <div className="b-doc-row">
                        <div className="b-doc-row-icon">📄</div>
                        <div className="b-doc-row-info">
                          <div className="b-doc-row-name">Business Teaser</div>
                          <div className="b-doc-row-sub">High-level overview · No NDA required</div>
                        </div>
                        <div className="b-doc-row-right">
                          <span className="b-doc-badge-free">✅ Unlocked</span>
                          <button className="b-doc-btn" onClick={() => toast.info("📥 Contact the lister for file access.", { position: "top-right" })}>📥 Download</button>
                        </div>
                      </div>
                      {listingDocuments.length > 0
                        ? listingDocuments.map((doc) => (
                          <div className="b-doc-row" key={doc.id}>
                            <div className="b-doc-row-icon">📎</div>
                            <div className="b-doc-row-info">
                              <div className="b-doc-row-name">{doc.document_name}</div>
                              <div className="b-doc-row-sub">
                                {(NDA_DOC_MAP[doc.document_type]?.label || doc.document_type)} · NDA on file
                              </div>
                            </div>
                            <div className="b-doc-row-right">
                              <span className="b-doc-badge-free">✅ Unlocked</span>
                              <a
                                className="b-doc-btn"
                                href={doc.file}
                                target="_blank"
                                rel="noreferrer"
                                style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}
                              >
                                📥 Download
                              </a>
                            </div>
                          </div>
                        ))
                        : ndaDocList.map((doc) => (
                          <div className="b-doc-row" key={doc.id}>
                            <div className="b-doc-row-icon">{doc.icon}</div>
                            <div className="b-doc-row-info">
                              <div className="b-doc-row-name">{doc.label}</div>
                              <div className="b-doc-row-sub">NDA on file — seller has not uploaded this file yet</div>
                            </div>
                            <div className="b-doc-row-right">
                              <span className="b-doc-badge-free">✅ Unlocked</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* ── ALL INFO ── */}
                {activeTab === "documents" && (() => {
                  const attrs = product.attributes || [];

                  const yesNo = (v) => {
                    const s = String(v || "").toLowerCase();
                    if (s === "true" || s === "yes" || s === "1") return "yes";
                    if (s === "false" || s === "no" || s === "0") return "no";
                    return null;
                  };

                  const isMoneyField = (name) => {
                    const l = (name || "").toLowerCase();
                    return l.includes("revenue") || l.includes("ebitda") || l.includes("sde") || l.includes("price") || l.includes("add-back") || l.includes("addback") || l.includes("normalized");
                  };

                  const formatVal = (name, value) => {
                    const yn = yesNo(value);
                    if (yn === "yes") return { label: "Yes", tone: "good" };
                    if (yn === "no") return { label: "No", tone: "neutral" };
                    const n = parseFloat(String(value || "").replace(/[^0-9.\-]/g, ""));
                    if (!isNaN(n)) {
                      if (n <= 0) return { label: "N/A", tone: "muted" };
                      if (isMoneyField(name)) return { label: `${currency}${formatMoney(n)}`, tone: "highlight" };
                      const l = (name || "").toLowerCase();
                      if (l.includes("multiple") || l.includes("%") || l.includes("margin") || l.includes("ratio")) return { label: String(value), tone: "highlight" };
                    }
                    if (!value || String(value).trim() === "") return { label: "—", tone: "muted" };
                    return { label: String(value), tone: "neutral" };
                  };

                  // Comprehensive groups covering every form section
                  const GROUPS = [
                    {
                      title: "📄 Listing Info",
                      isMeta: true,
                      items: [
                        product.brand_name && { name: "Brand / Company", value: product.brand_name },
                        product.subcategory?.name && { name: "Subcategory", value: product.subcategory.name },
                        product.vendor?.store_name && { name: "Listed by", value: product.vendor.store_name },
                        product.created_at && { name: "Date Listed", value: new Date(product.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) },
                        { name: "Listing ID", value: `#PS-${product.id?.slice(-7).toUpperCase()}` },
                      ].filter(Boolean),
                    },
                    {
                      title: "📍 Location",
                      keys: ["city", "state", "country", "zip", "zip / radius", "zip/radius", "address", "street address"],
                    },
                    {
                      title: "💰 Price & Financials",
                      keys: [
                        "asking price ($)", "asking price", "annual revenue", "revenue", "revenue ($)",
                        "ebitda", "ebitda ($)", "sde", "sde ($)", "normalized ebitda", "adjusted ebitda",
                        "ebitda multiple", "revenue multiple", "sde multiple",
                        "recurring rev %", "recurring revenue %",
                        "growth trend", "add-backs", "owner add-backs",
                        "financial snapshot (3-5 year summary)", "financial snapshot",
                        "historical financials available",
                      ],
                    },
                    {
                      title: "🏢 Business Overview",
                      keys: [
                        "industry", "sale type", "deal structure", "listing status", "status",
                        "business title", "years in operation", "employees", "owner involvement",
                        "transition type", "transition support", "financing options",
                      ],
                    },
                    {
                      title: "⚙️ Operations & Team",
                      keys: [
                        "staff roles", "technology stack", "key vendors", "key vendors / suppliers",
                        "automations present", "automations", "automation in place",
                        "crm/erp in place", "crm/erp",
                        "sops documented", "sops", "documented sops",
                      ],
                    },
                    {
                      title: "🌐 Remote & Digital",
                      keys: ["remote business", "remote", "web/mobile only", "multi-location", "digital-only"],
                    },
                    {
                      title: "🤖 AI & Automation",
                      keys: [
                        "ai leverageable", "ai-enabled operations", "ai-enabled", "ai in operations",
                        "ai upside", "ai upside potential",
                      ],
                    },
                    {
                      title: "🚀 Opportunities",
                      keys: [
                        "expansion opportunity", "expansion",
                        "cost reduction opportunity", "cost reduction",
                        "pricing power",
                        "recurring revenue",
                      ],
                    },
                    {
                      title: "⚠️ Risk Disclosures",
                      keys: [
                        "regulated industry", "licenses required", "pending litigation",
                        "customer concentration risk", "revenue dependency risk", "key person dependency",
                      ],
                    },
                    {
                      title: "✦ Smart Match Tags",
                      keys: ["smart features", "smart tags"],
                    },
                  ];

                  const usedNames = new Set();
                  const grouped = [];

                  GROUPS.forEach(({ title, keys, items, isMeta }) => {
                    if (isMeta) {
                      if (items && items.length > 0) grouped.push({ title, items, isMeta: true });
                      return;
                    }
                    const matches = attrs.filter((a) =>
                      (keys || []).includes((a.name || "").toLowerCase().trim()) && !usedNames.has(a.name)
                    );
                    matches.forEach((a) => usedNames.add(a.name));
                    if (matches.length > 0) grouped.push({ title, items: matches });
                  });

                  // Everything not yet categorised
                  const remaining = attrs.filter((a) => !usedNames.has(a.name));
                  if (remaining.length > 0) grouped.push({ title: "📋 Additional Details", items: remaining });

                  const toneStyle = (tone) => {
                    if (tone === "good")      return { background: "var(--green-bg)", border: "1px solid var(--green-border)", color: "var(--green)" };
                    if (tone === "highlight") return { background: "rgba(236,72,153,.08)", border: "1px solid rgba(236,72,153,.25)", color: "var(--pink)" };
                    if (tone === "muted")     return { background: "var(--surface-3,var(--surface-2))", border: "1px solid var(--border)", color: "var(--text-3)" };
                    return { background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" };
                  };

                  if (grouped.length === 0) {
                    return (
                      <div className="b-panel">
                        <p style={{ fontSize: 13, color: "var(--text-3)", fontStyle: "italic" }}>No additional information available.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="b-panel">
                      <h3 style={{ marginBottom: 20 }}>Full Listing Information</h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                        {grouped.map(({ title, items, isMeta }) => (
                          <div key={title}>
                            <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--text-3)", marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid var(--border)" }}>
                              {title}
                            </div>

                            {title === "✦ Smart Match Tags" ? (
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                {items.flatMap((a) =>
                                  String(a.value || "").split(",").map((t) => t.trim()).filter(Boolean).map((tag) => (
                                    <span key={tag} className="b-smart-tag">✦ {tag}</span>
                                  ))
                                )}
                              </div>
                            ) : (
                              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 8 }}>
                                {items.map((attr) => {
                                  const { label, tone } = isMeta ? { label: String(attr.value), tone: "neutral" } : formatVal(attr.name, attr.value);
                                  return (
                                    <div key={attr.name} style={{ padding: "11px 13px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 6 }}>
                                      <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--text-3)", marginBottom: 6 }}>
                                        {attr.name}
                                      </div>
                                      <span style={{ fontSize: 13, fontWeight: 600, padding: "2px 8px", borderRadius: 4, display: "inline-block", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", ...toneStyle(tone) }}>
                                        {label}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* SIMILAR LISTINGS */}
              {allProducts && allProducts.length > 0 && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>Similar Listings</h3>
                  </div>
                  <div className="b-sim-grid">
                    {allProducts
                      .filter((p) => p.id !== product.id && (p.category?.slug === "business4sale" || p.category?.slug === "business-for-sale"))
                      .slice(0, 3)
                      .map((p) => (
                        <div key={p.id} className="b-sim-card" onClick={() => window.location.href = `/product/productDetail/${p.slug}?productId=${p.id}`}>
                          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: "var(--text-3)", marginBottom: 6 }}>
                            {p.subcategory?.name || p.category?.name}
                          </div>
                          <div style={{ fontSize: 18, fontWeight: 800, color: "var(--pink)", marginBottom: 4 }}>
                            {currency}{formatMoney(Number(p.unit_price))}
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", lineHeight: 1.3, marginBottom: 6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                            {p.name}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--text-3)" }}>
                            📍 {p.vendor?.city || "—"}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Reviews */}
              {reviews && reviews.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <ProductDetailReviewSection reviews={reviews} product={product} />
                </div>
              )}
            </div>

            {/* ════ SIDEBAR ════ */}
            <div className="biz-side">

              {/* Asking price card */}
              <div className="b-side-card">
                <div className="b-side-asking">
                  <div>
                    <div className="b-side-asking-label">Asking Price</div>
                    <div className="b-side-asking-val">{formattedPrice}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                    <button
                      className={`b-btn-qa${isSaved ? " saved" : ""}`}
                      onClick={handleWishlistClick}
                      disabled={wishlistBusy}
                      style={{ gap: 5, minWidth: 80, transition: "all .2s", opacity: wishlistBusy ? 0.7 : 1 }}
                    >
                      {wishlistBusy ? (
                        <span style={{ width: 12, height: 12, border: "2px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.6s linear infinite" }} />
                      ) : isSaved ? (
                        <span style={{ animation: "b-heart-pop 0.3s ease" }}>♥</span>
                      ) : "♡"}
                      {" "}{isSaved ? "Saved" : "Save"}
                    </button>
                    <button className="b-btn-qa" onClick={handleShareClick}>
                      🔗 Share
                    </button>
                  </div>
                </div>

                <div className="b-side-mini">
                  {isPositiveMoney(revenue) && (
                    <div className="b-side-met">
                      <div className="b-side-met-v">{currency}{formatMoney(parseMoney(revenue))}</div>
                      <div className="b-side-met-k">Revenue</div>
                    </div>
                  )}
                  {(!lockEbitda || financialsUnlocked) && isPositiveMoney(ebitda) && (
                    <div className="b-side-met">
                      <div className="b-side-met-v">{currency}{formatMoney(parseMoney(ebitda))}</div>
                      <div className="b-side-met-k">SDE</div>
                    </div>
                  )}
                  {ebitdaMultiple && (
                    <div className="b-side-met">
                      <div className="b-side-met-v">{ebitdaMultiple}x</div>
                      <div className="b-side-met-k">Multiple</div>
                    </div>
                  )}
                  {yearsOp && (
                    <div className="b-side-met">
                      <div className="b-side-met-v">{yearsOp} yrs</div>
                      <div className="b-side-met-k">Operating</div>
                    </div>
                  )}
                  {employees && (
                    <div className="b-side-met">
                      <div className="b-side-met-v">{employees}</div>
                      <div className="b-side-met-k">Employees</div>
                    </div>
                  )}
                </div>

                {/* Financing badges */}
                <div style={{ padding: "10px 18px", borderBottom: "1px solid var(--border)", display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {yes(getAttr("sba eligible", "sba-eligible")) && (
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", background: "var(--green-bg)", border: "1px solid var(--green-border)", color: "var(--green)", borderRadius: 4 }}>SBA-Eligible</span>
                  )}
                  {financing && (
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", background: "var(--green-bg)", border: "1px solid var(--green-border)", color: "var(--green)", borderRadius: 4 }}>{financing}</span>
                  )}
                  {saleType && (
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-3)", borderRadius: 4 }}>{saleType}</span>
                  )}
                </div>

                {/* Metadata */}
                <div style={{ padding: 0 }}>
                  {ownerInvolvement && (
                    <div className="b-meta-row"><span className="b-meta-k">Owner Involvement</span><span className="b-meta-v">{ownerInvolvement}</span></div>
                  )}
                  {transitionType && (
                    <div className="b-meta-row"><span className="b-meta-k">Transition</span><span className="b-meta-v">{transitionType}</span></div>
                  )}
                  {employees && (
                    <div className="b-meta-row"><span className="b-meta-k">Employees</span><span className="b-meta-v">{employees}</span></div>
                  )}
                  {leaseRemaining && (
                    <div className="b-meta-row"><span className="b-meta-k">Lease</span><span className="b-meta-v">{leaseRemaining}</span></div>
                  )}
                  {inventory && (
                    <div className="b-meta-row"><span className="b-meta-k">Inventory</span><span className="b-meta-v">{inventory}</span></div>
                  )}
                  {ffe && (
                    <div className="b-meta-row"><span className="b-meta-k">FF&E</span><span className="b-meta-v">{ffe}</span></div>
                  )}
                  {daysOnMarket && (
                    <div className="b-meta-row"><span className="b-meta-k">Listed</span><span className="b-meta-v">{daysOnMarket} ago</span></div>
                  )}
                  <div className="b-meta-row">
                    <span className="b-meta-k">Listing ID</span>
                    <span className="b-meta-v" style={{ fontFamily: "'DM Mono', monospace", fontSize: 11 }}>
                      #PS-{product.id?.slice(-7).toUpperCase()}
                    </span>
                  </div>
                  <div className="b-meta-row">
                    <span className="b-meta-k">{isDealClosed ? "Lister" : "Listed by"}</span>
                    <span className="b-meta-v" style={{ maxWidth: 140, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {product.vendor?.store_name || [product.vendor?.first_name, product.vendor?.last_name].filter(Boolean).join(" ") || "Pinksurfing Seller"}
                    </span>
                  </div>
                </div>
              </div>


              {/* NDA sidebar card */}
              {!isListingOwner && (lockEbitda || lockFinancials) && (
                ndaSigned ? (
                  <div className="b-nda-side-card" style={{ background: "var(--green-bg)", border: "1.5px solid var(--green-border)" }}>
                    <h4 style={{ color: "var(--green)" }}>✅ NDA Accepted</h4>
                    <p style={{ color: "var(--green)" }}>Documents are ready. View them in your NDA Dashboard.</p>
                    <a href="/my-ndas" className="b-btn-nda-side" style={{ textDecoration: "none", background: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      View Documents →
                    </a>
                  </div>
                ) : ndaStatus === "pending_vendor" ? (
                  <div className="b-nda-side-card" style={{ background: "rgba(251,191,36,.08)", border: "1.5px solid rgba(251,191,36,.3)" }}>
                    <h4 style={{ color: "#fbbf24" }}>⏳ Awaiting Seller Review</h4>
                    <p style={{ color: "#fbbf24" }}>Your NDA payment is confirmed. The seller will accept and upload documents shortly.</p>
                    <a href="/my-ndas" className="b-btn-nda-side" style={{ textDecoration: "none", background: "#b45309", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      Track NDA Status →
                    </a>
                  </div>
                ) : ndaStatus === "disputed" ? (
                  <div className="b-nda-side-card" style={{ background: "rgba(248,113,113,.08)", border: "1.5px solid rgba(248,113,113,.35)" }}>
                    <h4 style={{ color: "#f87171" }}>⚠️ Dispute in progress</h4>
                    <p style={{ color: "#f87171" }}>This NDA is under dispute. Track updates in My NDAs.</p>
                    <a href="/my-ndas" className="b-btn-nda-side" style={{ textDecoration: "none", background: "#b91c1c", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      Open My NDAs →
                    </a>
                  </div>
                ) : ndaStatus === "pending_payment" ? (
                  <div className="b-nda-side-card" style={{ background: "rgba(59,130,246,.08)", border: "1.5px solid rgba(59,130,246,.35)" }}>
                    <h4 style={{ color: "#60a5fa" }}>💳 Complete payment</h4>
                    <p style={{ color: "#60a5fa" }}>Finish the $1 checkout (check your other browser tab) to submit your NDA.</p>
                    <a href="/my-ndas" className="b-btn-nda-side" style={{ textDecoration: "none", background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      My NDAs — retry link →
                    </a>
                  </div>
                ) : (
                  <div className="b-nda-side-card">
                    <h4>
                      🔒{" "}
                      {lockEbitda && lockFinancials
                        ? "EBITDA & Financials Locked"
                        : lockEbitda
                        ? "EBITDA / SDE Locked"
                        : "Full Financials Locked"}
                    </h4>
                    <p>
                      {lockEbitda && lockFinancials
                        ? "Sign the NDA and pay $1 to request financial documents from the seller."
                        : lockEbitda
                        ? "Sign the NDA and pay $1 to request SDE / EBITDA details."
                        : "Sign the NDA and pay $1 to request the full financial package."}
                    </p>
                    <button type="button" className="b-btn-nda-side" onClick={() => openNdaModal()}>
                      ✍ Sign NDA &amp; Pay $1
                    </button>
                  </div>
                )
              )}

              {/* Contact / Message */}
              <div className="b-side-card">
                <div className="b-side-head">
                  <h3>{isDealClosed ? "📩 Listing Closed" : "💬 Contact Lister"}</h3>
                  <p>
                    {isDealClosed
                      ? "This deal is no longer accepting offers."
                      : isListingOwner
                      ? "Buyers message you here — you can’t message yourself on your own listing."
                      : "Message the owner to move forward."}
                  </p>
                </div>
                <div className="b-side-body">
                  {activeVisit?.status === "vendor_reschedule_pending" && activeVisit?.pending_reschedule_at && (
                    <div style={{ background: "var(--indigo-bg)", border: "1px solid var(--indigo-border)", borderRadius: 8, padding: 14, marginBottom: 14 }}>
                      <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: "var(--indigo)", marginBottom: 6 }}>New time proposed</p>
                      <p style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 10 }}>
                        {new Date(activeVisit.pending_reschedule_at).toLocaleString(undefined, { weekday: "short", dateStyle: "medium", timeStyle: "short" })}
                      </p>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button type="button" onClick={() => respondToVendorReschedule(true)} style={{ flex: 1, padding: "8px", borderRadius: 6, background: "var(--indigo)", color: "#fff", border: "none", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Accept</button>
                        <button type="button" onClick={() => respondToVendorReschedule(false)} style={{ flex: 1, padding: "8px", borderRadius: 6, background: "none", color: "var(--text-2)", border: "1px solid var(--border)", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Decline</button>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    className={`b-btn-express${contactingAgent ? " sending" : ""}`}
                    disabled={isDealClosed || contactingAgent || isListingOwner}
                    onClick={handleContactAgent}
                  >
                    {contactingAgent ? (
                      <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,.3)", borderTop: "2px solid #fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                    ) : isDealClosed ? (
                      "Deal Closed"
                    ) : (
                      <>💬 Message Lister</>
                    )}
                  </button>

                  {activeVisit?.status === "accepted" && (
                    <button
                      type="button"
                      onClick={() => setDisputeModalOpen(true)}
                      style={{ width: "100%", marginTop: 8, padding: "8px", borderRadius: 6, background: "none", border: "1px solid var(--red-border)", color: "var(--red)", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                    >
                      Raise a Dispute
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LIGHTBOX */}
      {lightboxOpen && photos.length > 0 && (
        <div
          className="b-lightbox"
          onClick={() => setLightboxOpen(false)}
        >
          <button className="b-lightbox-close" onClick={() => setLightboxOpen(false)}>✕</button>

          {photos.length > 1 && (
            <button
              className="b-lightbox-prev"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex - 1 + photos.length) % photos.length); }}
            >
              ‹
            </button>
          )}

          <img
            className="b-lightbox-img"
            src={photos[lightboxIndex]}
            alt={`${product.name} — photo ${lightboxIndex + 1}`}
            onClick={(e) => e.stopPropagation()}
          />

          {photos.length > 1 && (
            <button
              className="b-lightbox-next"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex + 1) % photos.length); }}
            >
              ›
            </button>
          )}

          {photos.length > 1 && (
            <div className="b-lightbox-counter">{lightboxIndex + 1} / {photos.length}</div>
          )}
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}` }} />

      {/* ── NDA MODAL ── */}
      {ndaModalOpen && (
        <div className="b-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) { setNdaModalOpen(false); setNdaError(""); } }}>
          <div className="b-modal-box">
            <div className="b-modal-header">
              <div className="b-modal-header-text">
                <div className="b-modal-title">🔒 Sign NDA to Access Financial Documents</div>
                <div className="b-modal-subtitle">A one-time $1 fee is charged to verify your identity and unlock protected financials. A countersigned copy is emailed to you and the seller.</div>
              </div>
              <button className="b-modal-close" onClick={() => { setNdaModalOpen(false); setNdaError(""); }}>✕</button>
            </div>

            <div className="b-modal-body">
              <div className="b-nda-doc-text">
                <h4>NON-DISCLOSURE AGREEMENT</h4>
                <p>This Agreement is between the Disclosing Party (Business Seller via PinkSurfing) and the Receiving Party (identified by signature below).</p>
                <h5>1. Confidential Information</h5>
                <p>Includes financial statements, tax returns, revenue data, customer lists, contracts, operational procedures, and all information related to the listed business.</p>
                <h5>2. Receiving Party Obligations</h5>
                <p>(a) Keep all information strictly confidential. (b) Not disclose to any third party without consent. (c) Use solely to evaluate a potential acquisition.</p>
                <h5>3. Term</h5>
                <p>Valid for 1 year from date of signing.</p>
                <h5>4. Non-Solicitation</h5>
                <p>Receiving Party agrees not to solicit employees or key contractors of the listed business during the NDA term and 12 months thereafter.</p>
                <h5>5. Governing Law</h5>
                <p>Governed by the laws of the applicable jurisdiction.</p>
                <h5>6. AI Agent Restriction</h5>
                <p>AI agents cannot sign this agreement. Human signing authority is required.</p>
              </div>

              {/* Form fields */}
              <div className="b-nda-fields-grid">
                <div>
                  <label className="b-form-label">Full Legal Name *</label>
                  <input
                    className="b-form-input"
                    style={{ marginBottom: 0 }}
                    type="text"
                    placeholder="Jane Smith"
                    value={ndaForm.name}
                    onChange={(e) => setNdaForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="b-form-label">Email *</label>
                  <input
                    className="b-form-input"
                    style={{ marginBottom: 0 }}
                    type="email"
                    placeholder="jane@company.com"
                    value={ndaForm.email}
                    onChange={(e) => setNdaForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </div>
              </div>
              <div className="b-nda-fields-grid" style={{ marginTop: 0 }}>
                <div>
                  <label className="b-form-label">Company</label>
                  <input
                    className="b-form-input"
                    style={{ marginBottom: 0 }}
                    type="text"
                    placeholder="Acme Acquisitions LLC"
                    value={ndaForm.company}
                    onChange={(e) => setNdaForm((f) => ({ ...f, company: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="b-form-label">Buyer Role *</label>
                  <select
                    className="b-form-select"
                    style={{ marginBottom: 0 }}
                    value={ndaForm.role}
                    onChange={(e) => setNdaForm((f) => ({ ...f, role: e.target.value }))}
                  >
                    <option value="">Select…</option>
                    <option>Individual Buyer</option>
                    <option>Strategic Acquirer</option>
                    <option>Private Equity</option>
                    <option>Search Fund</option>
                    <option>Broker / Advisor</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label className="b-form-label">Digital Signature — Type your full legal name exactly *</label>
                <input
                  className="b-sig-field"
                  type="text"
                  placeholder="Type your full legal name to sign"
                  value={ndaForm.signature}
                  onChange={(e) => setNdaForm((f) => ({ ...f, signature: e.target.value }))}
                />
                <div className="b-sig-hint">By typing your name you confirm this is a legally binding electronic signature (ESIGN Act / UETA).</div>
              </div>

              <div className="b-agree-check">
                <input
                  type="checkbox"
                  id="nda-agree-check"
                  checked={ndaForm.agreed}
                  onChange={(e) => setNdaForm((f) => ({ ...f, agreed: e.target.checked }))}
                />
                <label htmlFor="nda-agree-check">
                  I have read and agree to all terms of this Non-Disclosure Agreement. I confirm I am a human with the legal authority to enter this Agreement on behalf of myself or my organisation.
                </label>
              </div>
            </div>

            {ndaError && (
              <div style={{
                margin: "0 0 12px",
                padding: "10px 14px",
                background: "rgba(220,38,38,0.12)",
                border: "1px solid rgba(220,38,38,0.35)",
                borderRadius: 8,
                color: "#f87171",
                fontSize: 13,
                fontWeight: 500,
                lineHeight: 1.5,
              }}>
                ⚠️ {ndaError}
              </div>
            )}
            <div className="b-modal-foot">
              <button className="b-btn-cancel" onClick={() => { setNdaModalOpen(false); setNdaError(""); }}>Cancel</button>
              <button
                type="button"
                className="b-btn-sign"
                onClick={handleSignNda}
                disabled={ndaSubmitting || isListingOwner || cannotStartNewNda}
              >
                {ndaSubmitting ? "⏳ Opening payment page…" : "✍ Sign NDA & Pay $1 to Unlock"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BusinessListingDetail;
