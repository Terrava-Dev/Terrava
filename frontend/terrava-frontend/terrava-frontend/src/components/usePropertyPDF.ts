import { useCallback } from "react"
import { useAuth } from "../context/AuthContext"
import appLogo from "../assets/logo.png"
import { getImageUrl } from "../utils/imageUrl"

type PropertyImage = { id: number; imageUrl: string; propertyId: number }
type BoundaryPoint = { latitude: number; longitude: number }

type Property = {
  id: number
  title: string
  locationName: string
  totalAreaInSqFt: number
  pricePerAcre: number
  pricePerSqFt: number
  totalPrice: number
  amenities?: string
  propertyType?: string
  notes?: string
  dtcpApproved?: boolean
  reraApproved?: boolean
  images?: PropertyImage[]
  boundaryPoints?: BoundaryPoint[]
}

const AMENITY_LABELS: Record<string, string> = {
  water: "Water",
  electric: "Electric",
  road: "Road Access",
  trees: "Trees",
  fencing: "Fencing",
  borewell: "Borewell",
}

const AMENITY_COLORS = [
  { bg: "#eff6ff", border: "#93c5fd", color: "#1d4ed8" },
  { bg: "#f0fdf4", border: "#86efac", color: "#15803d" },
  { bg: "#fff7ed", border: "#fdba74", color: "#c2410c" },
  { bg: "#fdf4ff", border: "#e9d5ff", color: "#7e22ce" },
  { bg: "#ecfeff", border: "#67e8f9", color: "#0f766e" },
  { bg: "#fef2f2", border: "#fca5a5", color: "#be123c" },
]

function sqftToCent(value: number) {
  return (value / 435.6).toFixed(2)
}

function sqftToAcre(value: number) {
  return (value / 43560).toFixed(4)
}

function fmtCompactPrice(value: number) {
  if (value >= 10000000) return `Rs.${(value / 10000000).toFixed(2)} Cr`
  if (value >= 100000) return `Rs.${(value / 100000).toFixed(1)} L`
  return `Rs.${Math.round(value).toLocaleString("en-IN")}`
}

function fmtFullPrice(value: number) {
  return `Rs.${Math.round(value).toLocaleString("en-IN")}`
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve()
      return
    }
    const script = document.createElement("script")
    script.src = src
    script.onload = () => resolve()
    script.onerror = () => reject()
    document.head.appendChild(script)
  })
}

async function ensureLibs() {
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js")
}

async function imgToDataUrl(url: string): Promise<string> {
  const path = (() => {
    try {
      return new URL(url).pathname
    } catch {
      return url
    }
  })()

  const found = Array.from(document.querySelectorAll("img") as NodeListOf<HTMLImageElement>).find((element) => {
    if (!element.complete || element.naturalWidth <= 0) return false
    try {
      return new URL(element.src).pathname === path
    } catch {
      return false
    }
  })

  if (found) {
    try {
      const canvas = document.createElement("canvas")
      canvas.width = found.naturalWidth
      canvas.height = found.naturalHeight
      canvas.getContext("2d")?.drawImage(found, 0, 0)
      return canvas.toDataURL("image/jpeg", 0.92)
    } catch {
      // fall through to fetch
    }
  }

  try {
    const blob = await fetch(url, { mode: "cors" }).then((response) => response.blob())
    const objectUrl = URL.createObjectURL(blob)
    const result = await new Promise<string>((resolve) => {
      const image = new Image()
      image.onload = () => {
        const canvas = document.createElement("canvas")
        canvas.width = image.naturalWidth
        canvas.height = image.naturalHeight
        canvas.getContext("2d")?.drawImage(image, 0, 0)
        resolve(canvas.toDataURL("image/jpeg", 0.92))
        URL.revokeObjectURL(objectUrl)
      }
      image.onerror = () => {
        resolve("")
        URL.revokeObjectURL(objectUrl)
      }
      image.src = objectUrl
    })
    return result
  } catch {
    return ""
  }
}

async function buildHTML(property: Property, agentName: string, agentPhone: string): Promise<string> {
  const images = property.images ?? []
  const amenityItems = (property.amenities ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
  const typeParts = (property.propertyType ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
  const mainType = typeParts[0] ?? "Property"
  const subTypes = typeParts.slice(1, 4)
  const displayDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })

  const imageDataUrls: string[] = []
  for (const image of images.slice(0, 4)) {
    const dataUrl = await imgToDataUrl(getImageUrl(image.imageUrl))
    if (dataUrl) imageDataUrls.push(dataUrl)
  }
  const logoDataUrl = await imgToDataUrl(appLogo)

  const heroImage = imageDataUrls[0]
  const galleryImages = imageDataUrls.slice(1, 4)
  const brandLogo = logoDataUrl || appLogo

  const approvalBadges = [
    property.dtcpApproved ? `<span class="pv-badge pv-badge-green">DTCP Approved</span>` : "",
    property.reraApproved ? `<span class="pv-badge pv-badge-blue">RERA Approved</span>` : "",
  ]
    .filter(Boolean)
    .join("")

  const amenityBadges = amenityItems
    .slice(0, 6)
    .map((item, index) => {
      const color = AMENITY_COLORS[index % AMENITY_COLORS.length]
      const label = escapeHtml(AMENITY_LABELS[item] ?? item.replace(/_/g, " "))
      return `<span class="pv-amenity" style="background:${color.bg};border-color:${color.border};color:${color.color}">${label}</span>`
    })
    .join("")

  const subtypeBadges = subTypes
    .map((item) => `<span class="pv-badge pv-badge-dark">${escapeHtml(item.replace(/_/g, " "))}</span>`)
    .join("")

  const notesBlock = property.notes?.trim()
    ? `
      <div class="pv-notes">
        <div class="pv-section-title">Quick Notes</div>
        <p>${escapeHtml(property.notes.trim())}</p>
      </div>
    `
    : ""

  const galleryBlock = galleryImages.length
    ? `
      <div class="pv-gallery">
        ${galleryImages
          .map(
            (image) => `
              <div class="pv-gallery-item">
                <img src="${image}" alt="" />
              </div>
            `,
          )
          .join("")}
      </div>
    `
    : ""

  return `
    <div class="pv-root">
      <style>
        * { box-sizing: border-box; }
        .pv-root {
          width: 760px;
          background:
            radial-gradient(circle at top left, rgba(111, 180, 255, 0.16), transparent 30%),
            radial-gradient(circle at right top, rgba(255, 196, 88, 0.18), transparent 32%),
            linear-gradient(180deg, #f6faff 0%, #edf4ff 100%);
          color: #10223f;
          font-family: "Segoe UI", Arial, sans-serif;
          padding: 28px;
        }
        .pv-shell {
          overflow: hidden;
          border-radius: 34px;
          background: rgba(255, 255, 255, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.86);
          box-shadow: 0 28px 80px rgba(20, 45, 90, 0.16);
          backdrop-filter: blur(18px);
        }
        .pv-hero {
          position: relative;
          height: 380px;
          background: linear-gradient(135deg, #d8e7ff 0%, #b8d2ff 48%, #9ccfbe 100%);
        }
        .pv-hero img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .pv-hero-fallback {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(16, 34, 63, 0.55);
          font-size: 26px;
          font-weight: 700;
          letter-spacing: 0.04em;
        }
        .pv-hero::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(10, 22, 41, 0.05) 0%, rgba(10, 22, 41, 0.58) 100%);
        }
        .pv-topbar {
          position: absolute;
          top: 22px;
          left: 22px;
          right: 22px;
          z-index: 2;
          display: flex;
          justify-content: flex-end;
          align-items: flex-start;
          gap: 16px;
        }
        .pv-id-pill {
          padding: 11px 14px;
          border-radius: 20px;
          background: rgba(15, 28, 48, 0.34);
          border: 1px solid rgba(255, 255, 255, 0.18);
          color: #ffffff;
          font-size: 12px;
          font-weight: 700;
          backdrop-filter: blur(12px);
        }
        .pv-photo-count {
          position: absolute;
          right: 22px;
          bottom: 22px;
          z-index: 2;
          padding: 10px 14px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.18);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #ffffff;
          font-size: 12px;
          font-weight: 700;
          backdrop-filter: blur(14px);
        }
        .pv-summary {
          position: relative;
          margin: -76px 24px 0;
          z-index: 3;
          border-radius: 28px;
          padding: 22px;
          background: rgba(255, 255, 255, 0.82);
          border: 1px solid rgba(255, 255, 255, 0.88);
          box-shadow: 0 24px 46px rgba(18, 44, 90, 0.12);
          backdrop-filter: blur(18px);
        }
        .pv-summary-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 18px;
        }
        .pv-kicker {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #7f90ad;
          margin-bottom: 8px;
        }
        .pv-title {
          margin: 0;
          font-size: 34px;
          line-height: 1.05;
          font-weight: 800;
          color: #132544;
        }
        .pv-location {
          margin-top: 10px;
          font-size: 14px;
          color: #697a97;
        }
        .pv-price-pill {
          flex-shrink: 0;
          min-width: 190px;
          padding: 16px 18px;
          border-radius: 24px;
          background: linear-gradient(135deg, #10233f 0%, #1f3e71 100%);
          box-shadow: 0 16px 28px rgba(16, 35, 63, 0.22);
          color: #ffffff;
          text-align: right;
        }
        .pv-price-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.72);
        }
        .pv-price-value {
          margin-top: 6px;
          font-size: 24px;
          font-weight: 800;
          line-height: 1.05;
        }
        .pv-price-meta {
          margin-top: 8px;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.72);
        }
        .pv-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 16px;
        }
        .pv-badge {
          display: inline-flex;
          align-items: center;
          min-height: 34px;
          padding: 8px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
        }
        .pv-badge-green {
          background: #ecfdf3;
          border: 1px solid #8be2b2;
          color: #157347;
        }
        .pv-badge-blue {
          background: #eef4ff;
          border: 1px solid #b7cbff;
          color: #2850a7;
        }
        .pv-badge-dark {
          background: rgba(16, 35, 63, 0.07);
          border: 1px solid rgba(16, 35, 63, 0.08);
          color: #33496b;
          text-transform: capitalize;
        }
        .pv-content {
          padding: 26px 24px 24px;
        }
        .pv-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }
        .pv-stat {
          padding: 16px;
          border-radius: 22px;
          background: rgba(248, 251, 255, 0.95);
          border: 1px solid rgba(214, 225, 241, 0.95);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.88);
        }
        .pv-stat-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #7f90ad;
        }
        .pv-stat-value {
          margin-top: 10px;
          font-size: 19px;
          line-height: 1.15;
          font-weight: 800;
          color: #132544;
        }
        .pv-meta {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 14px;
          margin-top: 14px;
        }
        .pv-panel {
          padding: 18px;
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.7);
          border: 1px solid rgba(223, 232, 246, 0.95);
        }
        .pv-section-title {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #7f90ad;
          margin-bottom: 12px;
        }
        .pv-amenity-wrap {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .pv-amenity {
          display: inline-flex;
          align-items: center;
          min-height: 34px;
          padding: 8px 12px;
          border-radius: 999px;
          border: 1px solid transparent;
          font-size: 12px;
          font-weight: 700;
        }
        .pv-location-panel-value {
          font-size: 22px;
          line-height: 1.2;
          font-weight: 800;
          color: #132544;
        }
        .pv-location-panel-sub {
          margin-top: 8px;
          font-size: 13px;
          color: #6e7f9b;
          line-height: 1.55;
        }
        .pv-gallery {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          margin-top: 14px;
        }
        .pv-gallery-item {
          height: 104px;
          border-radius: 18px;
          overflow: hidden;
          background: linear-gradient(135deg, #dce9ff, #c8dafe);
        }
        .pv-gallery-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .pv-notes {
          margin-top: 14px;
          padding: 18px;
          border-radius: 24px;
          background: linear-gradient(135deg, rgba(255, 248, 233, 0.95), rgba(255, 255, 255, 0.85));
          border: 1px solid rgba(244, 200, 104, 0.32);
        }
        .pv-notes p {
          margin: 0;
          font-size: 14px;
          line-height: 1.7;
          color: #43546f;
        }
        .pv-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-top: 18px;
          padding-top: 18px;
          border-top: 1px solid rgba(214, 225, 241, 0.9);
        }
        .pv-footer-brand {
          font-size: 15px;
          font-weight: 800;
          letter-spacing: 0.14em;
          color: #1a335c;
        }
        .pv-footer-sub {
          margin-top: 4px;
          font-size: 12px;
          color: #7f90ad;
        }
        .pv-footer-date {
          padding: 10px 12px;
          border-radius: 16px;
          background: rgba(16, 35, 63, 0.06);
          color: #5f7190;
          font-size: 12px;
          font-weight: 700;
        }
        .pv-footer-mark {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .pv-footer-logo {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.82);
          box-shadow: 0 8px 20px rgba(91, 116, 166, 0.12);
          flex-shrink: 0;
        }
        .pv-footer-logo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .pv-agent-card {
          margin-top: 14px;
          padding: 18px 20px;
          border-radius: 24px;
          background: linear-gradient(135deg, #112440 0%, #1e4277 100%);
          box-shadow: 0 20px 38px rgba(17, 36, 64, 0.18);
          color: #ffffff;
        }
        .pv-agent-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.68);
        }
        .pv-agent-name {
          margin-top: 8px;
          font-size: 26px;
          line-height: 1.1;
          font-weight: 800;
        }
        .pv-agent-phone {
          margin-top: 8px;
          font-size: 20px;
          line-height: 1.2;
          font-weight: 800;
          color: #ffd67b;
        }
        .pv-agent-sub {
          margin-top: 8px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.74);
        }
      </style>

      <div class="pv-shell">
        <div class="pv-hero">
          ${heroImage ? `<img src="${heroImage}" alt="" />` : `<div class="pv-hero-fallback">Property Preview</div>`}

          <div class="pv-topbar">
            <div class="pv-id-pill">Property #${property.id}</div>
          </div>

          ${images.length > 1 ? `<div class="pv-photo-count">${images.length} Photos</div>` : ""}
        </div>

        <div class="pv-summary">
          <div class="pv-summary-top">
            <div>
              <div class="pv-kicker">${escapeHtml(mainType.replace(/_/g, " "))}</div>
              <h1 class="pv-title">${escapeHtml(property.title)}</h1>
              <div class="pv-location">${escapeHtml(property.locationName)}</div>
            </div>

            <div class="pv-price-pill">
              <div class="pv-price-label">Total Price</div>
              <div class="pv-price-value">${fmtCompactPrice(property.totalPrice)}</div>
              <div class="pv-price-meta">Property card image</div>
            </div>
          </div>

          ${(approvalBadges || subtypeBadges) ? `<div class="pv-badges">${approvalBadges}${subtypeBadges}</div>` : ""}
        </div>

        <div class="pv-content">
          <div class="pv-stats">
            <div class="pv-stat">
              <div class="pv-stat-label">Area</div>
              <div class="pv-stat-value">${Math.round(property.totalAreaInSqFt).toLocaleString("en-IN")} sq ft</div>
            </div>
            <div class="pv-stat">
              <div class="pv-stat-label">Per Sq Ft</div>
              <div class="pv-stat-value">${property.pricePerSqFt > 0 ? fmtFullPrice(property.pricePerSqFt) : "NA"}</div>
            </div>
            <div class="pv-stat">
              <div class="pv-stat-label">In Cent</div>
              <div class="pv-stat-value">${sqftToCent(property.totalAreaInSqFt)}</div>
            </div>
            <div class="pv-stat">
              <div class="pv-stat-label">In Acre</div>
              <div class="pv-stat-value">${sqftToAcre(property.totalAreaInSqFt)}</div>
            </div>
          </div>

          <div class="pv-meta">
            <div class="pv-panel">
              <div class="pv-section-title">Highlights</div>
              ${amenityBadges ? `<div class="pv-amenity-wrap">${amenityBadges}</div>` : `<div class="pv-location-panel-sub">Add amenities to make this property card even richer.</div>`}
            </div>

            <div class="pv-panel">
              <div class="pv-section-title">Location</div>
              <div class="pv-location-panel-value">${escapeHtml(property.locationName)}</div>
              <div class="pv-location-panel-sub">Modern export image for sharing in chat, social media, and gallery.</div>
            </div>
          </div>

          ${galleryBlock}
          ${notesBlock}
          <div class="pv-agent-card">
            <div class="pv-agent-label">Agent Contact</div>
            <div class="pv-agent-name">${escapeHtml(agentName || "Terrava Agent")}</div>
            <div class="pv-agent-phone">${escapeHtml(agentPhone || "Contact details unavailable")}</div>
            <div class="pv-agent-sub">Connect directly for site visit, pricing, and closing support.</div>
          </div>

          <div class="pv-footer">
            <div class="pv-footer-mark">
              <div class="pv-footer-logo">
                <img src="${brandLogo}" alt="" />
              </div>
              <div>
                <div class="pv-footer-brand">Terrava</div>
                <div class="pv-footer-sub">A JeeSha Group company</div>
              </div>
            </div>
            <div class="pv-footer-date">${displayDate}</div>
          </div>
        </div>
      </div>
    </div>
  `
}

async function generateImage(property: Property, agentName: string, agentPhone: string): Promise<Blob> {
  await ensureLibs()

  const html = await buildHTML(property, agentName, agentPhone)
  const container = document.createElement("div")
  container.style.cssText = "position:fixed;left:-9999px;top:0;z-index:-1;background:white"
  container.innerHTML = html
  document.body.appendChild(container)

  await Promise.all(
    Array.from(container.querySelectorAll("img")).map((image) =>
      image.complete
        ? Promise.resolve()
        : new Promise((resolve) => {
            image.onload = () => resolve(null)
            image.onerror = () => resolve(null)
          }),
    ),
  )

  await new Promise((resolve) => setTimeout(resolve, 500))

  const canvas = await (window as { html2canvas: (element: HTMLElement, options: object) => Promise<HTMLCanvasElement> }).html2canvas(
    container.firstElementChild as HTMLElement,
    {
      scale: 3,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: "#edf4ff",
    },
  )

  document.body.removeChild(container)

  return await new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error("Unable to create image blob"))
    }, "image/png")
  })
}

function saveLocally(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

async function shareViaNative(blob: Blob, filename: string, title: string): Promise<boolean> {
  if (!navigator.canShare) return false
  const file = new File([blob], filename, { type: "image/png" })
  if (!navigator.canShare({ files: [file] })) return false

  try {
    await navigator.share({ title, files: [file] })
    return true
  } catch {
    return false
  }
}

export type ShareAction = "save" | "whatsapp" | "instagram" | "facebook"

export function usePropertyPDF() {
  const { agent } = useAuth()

  const generate = useCallback(async (property: Property, action: ShareAction) => {
    const agentName = agent?.fullName?.trim() || "Terrava Agent"
    const agentPhone = agent?.phone?.trim() || ""
    const blob = await generateImage(property, agentName, agentPhone)
    const filename = `${property.title.replace(/\s+/g, "_")}_terrava.png`
    const shareText = [
      property.title,
      `Location: ${property.locationName}`,
      `Area: ${Math.round(property.totalAreaInSqFt).toLocaleString("en-IN")} sq ft`,
      `Total: ${fmtFullPrice(property.totalPrice)}`,
    ].join("\n")

    switch (action) {
      case "save":
        saveLocally(blob, filename)
        break
      case "whatsapp": {
        const shared = await shareViaNative(blob, filename, property.title)
        if (!shared) {
          saveLocally(blob, filename)
          setTimeout(() => {
            window.open(
              `https://wa.me/?text=${encodeURIComponent(`${shareText}\n\nImage saved. Attach it in WhatsApp.`)}`,
              "_blank",
            )
          }, 500)
        }
        break
      }
      case "instagram": {
        const shared = await shareViaNative(blob, filename, property.title)
        if (!shared) {
          saveLocally(blob, filename)
          alert("Image saved to your device. Open Instagram and post it from your gallery.")
        }
        break
      }
      case "facebook":
        saveLocally(blob, filename)
        setTimeout(() => {
          window.open(
            `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(shareText)}`,
            "_blank",
          )
        }, 500)
        break
    }
  }, [agent])

  return { generate }
}
