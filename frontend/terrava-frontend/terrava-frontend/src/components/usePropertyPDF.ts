import { useCallback } from "react"

type PropertyImage  = { id: number; imageUrl: string; propertyId: number }
type BoundaryPoint  = { latitude: number; longitude: number }

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
  images?: PropertyImage[]
  boundaryPoints?: BoundaryPoint[]
}

const BASE_URL = `${import.meta.env.VITE_API_URL}`

const AMENITY_LABELS: Record<string, string> = {
  water: "💧 Water", electric: "⚡ Electric", road: "🛣️ Road Access",
  trees: "🌳 Trees", fencing: "🪧 Fencing",  borewell: "🔩 Borewell",
}

const AMENITY_COLORS = [
  { bg:"#f0fdf4", border:"#86efac", color:"#15803d" },
  { bg:"#fffbeb", border:"#fcd34d", color:"#b45309" },
  { bg:"#eff6ff", border:"#93c5fd", color:"#1d4ed8" },
  { bg:"#fdf4ff", border:"#d8b4fe", color:"#7e22ce" },
  { bg:"#fff1f2", border:"#fda4af", color:"#be123c" },
  { bg:"#f0fdf4", border:"#86efac", color:"#15803d" },
]

function sqftToCent(s: number) { return (s / 435.6).toFixed(2) }
function sqftToAcre(s: number) { return (s / 43560).toFixed(4) }
function fmtPrice(n: number)   { return "Rs. " + Math.round(n).toLocaleString("en-IN") }

function loadScript(src: string): Promise<void> {
  return new Promise((res, rej) => {
    if (document.querySelector(`script[src="${src}"]`)) { res(); return }
    const s = document.createElement("script")
    s.src = src; s.onload = () => res(); s.onerror = () => rej()
    document.head.appendChild(s)
  })
}

async function ensureLibs() {
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js")
}

async function imgToDataUrl(url: string): Promise<string> {
  // Try DOM first (already loaded, no CORS issue)
  const path = (() => { try { return new URL(url).pathname } catch { return url } })()
  const found = Array.from(document.querySelectorAll("img") as NodeListOf<HTMLImageElement>)
    .find(el => el.complete && el.naturalWidth > 0 &&
      (() => { try { return new URL(el.src).pathname === path } catch { return false } })())
  if (found) {
    try {
      const c = document.createElement("canvas")
      c.width = found.naturalWidth; c.height = found.naturalHeight
      c.getContext("2d")!.drawImage(found, 0, 0)
      return c.toDataURL("image/jpeg", 0.9)
    } catch {}
  }
  // Fetch as blob
  try {
    const blob = await fetch(url, { mode:"cors" }).then(r => r.blob())
    const bu   = URL.createObjectURL(blob)
    const result = await new Promise<string>(res => {
      const img = new Image()
      img.onload = () => {
        const c = document.createElement("canvas")
        c.width = img.naturalWidth; c.height = img.naturalHeight
        c.getContext("2d")!.drawImage(img, 0, 0)
        res(c.toDataURL("image/jpeg", 0.9))
        URL.revokeObjectURL(bu)
      }
      img.onerror = () => { res(""); URL.revokeObjectURL(bu) }
      img.src = bu
    })
    if (result) return result
  } catch {}
  return ""
}

// ── Build HTML template ────────────────────────────────────────────────────────
async function buildHTML(property: Property): Promise<string> {
  const imgs    = property.images ?? []
  const amenList= (property.amenities ?? "").split(",").filter(Boolean)
  const parts   = (property.propertyType ?? "").split(",").filter(Boolean)
  const mainType= parts[0] ?? ""
  const subTypes= parts.slice(1)
  const date    = new Date().toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" })

  // Load images as data URLs so html2canvas captures them
  const imgDataUrls: string[] = []
  for (const img of imgs.slice(0, 5)) {
    const d = await imgToDataUrl(`${BASE_URL}${img.imageUrl}`)
    imgDataUrls.push(d)
  }

  const center = (() => {
    const pts = property.boundaryPoints ?? []
    if (!pts.length) return null
    return {
      lat: (pts.reduce((s,p) => s + Number(p.latitude),  0) / pts.length).toFixed(4),
      lng: (pts.reduce((s,p) => s + Number(p.longitude), 0) / pts.length).toFixed(4),
    }
  })()

  const heroImg  = imgDataUrls[0]
  const extraImgs= imgDataUrls.slice(1)

  const amenChips = amenList.map((a, i) => {
    const c = AMENITY_COLORS[i % AMENITY_COLORS.length]
    return `<span style="background:${c.bg};border:1.5px solid ${c.border};color:${c.color};
      border-radius:100px;padding:5px 12px;font-size:11px;font-weight:700;display:inline-flex;align-items:center;gap:4px;margin:3px">
      ${AMENITY_LABELS[a] ?? a}</span>`
  }).join("")

  const subBadges = subTypes.map(s =>
    `<span style="background:rgba(255,255,255,0.12);color:rgba(255,255,255,0.8);border:1px solid rgba(255,255,255,0.2);
      border-radius:100px;padding:3px 10px;font-size:10px;font-weight:700">
      ${s.replace(/_/g," ")}</span>`
  ).join(" ")

  const extraPhotos = extraImgs.length > 0 ? `
    <div style="padding:14px 20px 6px">
      <div style="font-size:10px;font-weight:800;color:#10a855;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">🖼️ More Photos</div>
      <div style="display:grid;grid-template-columns:repeat(${extraImgs.length},1fr);gap:8px">
        ${extraImgs.map(d => d
          ? `<div style="height:70px;border-radius:8px;overflow:hidden"><img src="${d}" style="width:100%;height:100%;object-fit:cover;display:block"/></div>`
          : `<div style="height:90px;border-radius:8px;background:#d1fae5;display:flex;align-items:center;justify-content:center;font-size:10px;color:#16a34a;font-weight:600">Photo</div>`
        ).join("")}
      </div>
    </div>` : ""

  const mapStrip = center ? `
    <div style="margin:0 20px 14px;background:#f0fdf4;border:1.5px solid #86efac;border-radius:10px;padding:10px 14px;display:flex;align-items:center;gap:12px">
      <span style="font-size:22px">🗺️</span>
      <div style="flex:1">
        <div style="font-size:11px;font-weight:800;color:#15803d">${property.locationName}</div>
        <div style="font-size:9px;color:#888;margin-top:2px;font-family:monospace">${center.lat}° N, ${center.lng}° E · ${property.boundaryPoints?.length ?? 0} boundary points</div>
      </div>
      <div style="background:#10a855;color:#fff;font-size:9px;font-weight:800;padding:5px 12px;border-radius:100px">📌 VIEW</div>
    </div>` : ""

  return `
  <div style="width:700px;background:#fff;font-family:'Segoe UI',Arial,sans-serif;position:relative;overflow:hidden">



    <div style="position:relative;z-index:1">

      <!-- ACCENT BAR -->
      <div style="height:5px;background:linear-gradient(90deg,#10a855,#34d399,#10a855)"></div>

      <!-- HEADER -->
      <div style="background:#10a855;padding:12px 20px;display:flex;align-items:center;justify-content:space-between">
        <div>
          <div style="font-size:18px;font-weight:900;color:#fff;letter-spacing:3px">TERRAVA</div>
          <div style="font-size:9px;color:rgba(255,255,255,0.7);letter-spacing:1.5px;text-transform:uppercase;margin-top:1px">Property Listing Report</div>
        </div>
        <div style="text-align:right">
          <div style="background:rgba(255,255,255,0.18);color:#fff;font-size:10px;font-weight:800;padding:4px 12px;border-radius:100px">ID #${property.id}</div>
          <div style="font-size:9px;color:rgba(255,255,255,0.65);margin-top:4px">${date}</div>
        </div>
      </div>

      <!-- HERO IMAGE -->
      <div style="height:240px;position:relative;overflow:hidden;background:linear-gradient(135deg,#d1fae5,#6ee7b7)">
        ${heroImg
          ? `<img src="${heroImg}" style="width:100%;height:100%;object-fit:cover;display:block"/>`
          : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:13px;color:#16a34a;font-weight:600">🏡 Property Photo</div>`
        }
        <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.65) 0%,transparent 55%)"></div>
        ${imgs.length > 1 ? `<div style="position:absolute;bottom:10px;right:12px;background:rgba(0,0,0,0.5);color:#fff;font-size:9px;font-weight:700;padding:3px 9px;border-radius:100px">📷 ${imgs.length} photos</div>` : ""}
      </div>

      <!-- DARK NAME CARD -->
      <div style="background:#111;padding:14px 20px;display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
        <div style="flex:1;min-width:0">
          <div style="font-size:22px;font-weight:900;color:#fff;letter-spacing:-0.5px;margin-bottom:5px">${property.title} ✨</div>
          <div style="display:flex;align-items:center;gap:5px;font-size:11px;color:rgba(255,255,255,0.5)">
            <span>📍</span>${property.locationName}
          </div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:5px;flex-shrink:0">
          ${mainType ? `<div style="background:#10a855;color:#fff;font-size:9px;font-weight:800;padding:4px 12px;border-radius:100px;text-transform:uppercase">${mainType}</div>` : ""}
          ${subBadges ? `<div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end">${subBadges}</div>` : ""}
        </div>
      </div>

      <!-- PRICE STRIPE -->
      <div style="background:#f8fffb;border-top:1px solid #d1fae5;border-bottom:1px solid #d1fae5;display:grid;grid-template-columns:1fr 1px 1fr 1px 1fr">
        <div style="padding:14px;text-align:center">
          <div style="font-size:9px;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:4px">💰 Total Price</div>
          <div style="font-size:22px;font-weight:900;color:#10a855;letter-spacing:-0.8px">${fmtPrice(property.totalPrice)}</div>
        </div>
        <div style="background:#d1fae5"></div>
        <div style="padding:14px;text-align:center">
          <div style="font-size:9px;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:4px">📐 Area</div>
          <div style="font-size:14px;font-weight:900;color:#111">${Math.round(property.totalAreaInSqFt).toLocaleString("en-IN")} sq ft</div>
        </div>
        <div style="background:#d1fae5"></div>
        <div style="padding:14px;text-align:center">
          <div style="font-size:9px;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:4px">📊 Per Sq Ft</div>
          <div style="font-size:14px;font-weight:900;color:#111">${property.pricePerSqFt > 0 ? "Rs. "+property.pricePerSqFt.toLocaleString("en-IN") : "—"}</div>
        </div>
      </div>

      <!-- STATS ROW -->
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:12px 16px;background:#fafafa;border-bottom:1px solid #f0f0f0">
        <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:10px 12px;display:flex;align-items:center;gap:10px">
          <span style="font-size:20px">🌿</span>
          <div><div style="font-size:12px;font-weight:800;color:#111">${sqftToCent(property.totalAreaInSqFt)} cent</div><div style="font-size:8px;font-weight:600;color:#aaa;text-transform:uppercase;letter-spacing:0.4px;margin-top:1px">Cent</div></div>
        </div>
        <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:10px;padding:10px 12px;display:flex;align-items:center;gap:10px">
          <span style="font-size:20px">🗺️</span>
          <div><div style="font-size:12px;font-weight:800;color:#111">${sqftToAcre(property.totalAreaInSqFt)} ac</div><div style="font-size:8px;font-weight:600;color:#aaa;text-transform:uppercase;letter-spacing:0.4px;margin-top:1px">Acre</div></div>
        </div>
        <div style="background:#eff6ff;border:1px solid #93c5fd;border-radius:10px;padding:10px 12px;display:flex;align-items:center;gap:10px">
          <span style="font-size:20px">📅</span>
          <div><div style="font-size:12px;font-weight:800;color:#111">${date}</div><div style="font-size:8px;font-weight:600;color:#aaa;text-transform:uppercase;letter-spacing:0.4px;margin-top:1px">Listed</div></div>
        </div>
      </div>

      <!-- DETAIL GRID -->
      <div style="padding:14px 20px 10px">
        <div style="font-size:10px;font-weight:800;color:#10a855;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">📋 Property Details</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
          <div style="background:#f0fdf4;border:1px solid #d1fae5;border-radius:10px;padding:9px 12px;display:flex;align-items:center;gap:10px">
            <span style="font-size:18px">🏠</span><div><div style="font-size:8px;font-weight:700;color:#aaa;text-transform:uppercase">Type</div><div style="font-size:11px;font-weight:800;color:#111;margin-top:1px">${mainType || "—"} ${subTypes.slice(0,2).map(s=>s.replace(/_/g," ")).join(" · ")}</div></div>
          </div>
          <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:9px 12px;display:flex;align-items:center;gap:10px">
            <span style="font-size:18px">📍</span><div><div style="font-size:8px;font-weight:700;color:#aaa;text-transform:uppercase">Location</div><div style="font-size:11px;font-weight:800;color:#111;margin-top:1px">${property.locationName}</div></div>
          </div>
          <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:9px 12px;display:flex;align-items:center;gap:10px">
            <span style="font-size:18px">📐</span><div><div style="font-size:8px;font-weight:700;color:#aaa;text-transform:uppercase">Area</div><div style="font-size:11px;font-weight:800;color:#111;margin-top:1px">${Math.round(property.totalAreaInSqFt).toLocaleString("en-IN")} sq ft</div></div>
          </div>
          <div style="background:#fdf4ff;border:1px solid #e9d5ff;border-radius:10px;padding:9px 12px;display:flex;align-items:center;gap:10px">
            <span style="font-size:18px">🌿</span><div><div style="font-size:8px;font-weight:700;color:#aaa;text-transform:uppercase">Cent / Acre</div><div style="font-size:11px;font-weight:800;color:#111;margin-top:1px">${sqftToCent(property.totalAreaInSqFt)} cent · ${sqftToAcre(property.totalAreaInSqFt)} ac</div></div>
          </div>
          <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:9px 12px;display:flex;align-items:center;gap:10px">
            <span style="font-size:18px">💰</span><div><div style="font-size:8px;font-weight:700;color:#aaa;text-transform:uppercase">Price / Sq Ft</div><div style="font-size:11px;font-weight:800;color:#111;margin-top:1px">${property.pricePerSqFt > 0 ? "Rs. "+property.pricePerSqFt.toLocaleString("en-IN") : "—"}</div></div>
          </div>
          <div style="background:#f0fdf4;border:1px solid #d1fae5;border-radius:10px;padding:9px 12px;display:flex;align-items:center;gap:10px">
            <span style="font-size:18px">🆔</span><div><div style="font-size:8px;font-weight:700;color:#aaa;text-transform:uppercase">Property ID</div><div style="font-size:11px;font-weight:800;color:#111;margin-top:1px">#${property.id}</div></div>
          </div>
        </div>
      </div>

      <!-- AMENITIES -->
      ${amenList.length > 0 ? `
      <div style="padding:0 20px 14px">
        <div style="font-size:10px;font-weight:800;color:#10a855;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">✨ Amenities</div>
        <div style="display:flex;flex-wrap:wrap">${amenChips}</div>
      </div>` : ""}

      <!-- EXTRA PHOTOS -->
      ${extraPhotos}

      <!-- MAP STRIP -->
      ${mapStrip}



      <!-- NOTES -->
      ${property.notes && property.notes.trim() ? `
      <div style="margin:0 20px 14px;background:#fffbeb;border:1.5px solid #fcd34d;border-radius:10px;padding:12px 16px">
        <div style="font-size:10px;font-weight:800;color:#b45309;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">📝 Agent Notes</div>
        <div style="font-size:11px;color:#444;line-height:1.6;">${property.notes}</div>
      </div>` : ""}

      <!-- FOOTER -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding:9px 20px;background:#f8fffb;border-top:3px solid #10a855">
        <div style="display:flex;align-items:center;gap:6px">
          <div style="width:8px;height:8px;border-radius:50%;background:#10a855"></div>
          <div style="font-size:11px;font-weight:900;color:#10a855;letter-spacing:1.5px">TERRAVA</div>
        </div>
        <div style="font-size:8px;color:#bbb">terrava.app · Generated ${date}</div>
        <div style="background:#f0fdf4;color:#16a34a;font-size:8px;font-weight:700;padding:2px 8px;border-radius:100px;border:1px solid #86efac">Page 1 / 1</div>
      </div>

    </div>
  </div>`
}

// ── Render HTML to image using html2canvas ─────────────────────────────────────
async function generateImage(property: Property): Promise<Blob> {
  await ensureLibs()

  const html = await buildHTML(property)

  // Mount hidden container
  const container = document.createElement("div")
  container.style.cssText = "position:fixed;left:-9999px;top:0;z-index:-1;background:white"
  container.innerHTML = html
  document.body.appendChild(container)

  // Wait for images to load
  await Promise.all(
    Array.from(container.querySelectorAll("img")).map(img =>
      img.complete ? Promise.resolve() : new Promise(res => { img.onload = img.onerror = res })
    )
  )
  await new Promise(res => setTimeout(res, 600))

  const canvas = await (window as any).html2canvas(container.firstElementChild as HTMLElement, {
    scale: 3,
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: "#ffffff",
  })

  document.body.removeChild(container)

  return await new Promise(res => canvas.toBlob((b: Blob) => res(b), "image/png"))
}

function saveLocally(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a   = document.createElement("a")
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

async function shareViaNative(blob: Blob, filename: string, title: string): Promise<boolean> {
  if (!navigator.canShare) return false
  const file = new File([blob], filename, { type: "image/png" })
  if (!navigator.canShare({ files:[file] })) return false
  try { await navigator.share({ title, files:[file] }); return true }
  catch { return false }
}

export type ShareAction = "save" | "whatsapp" | "instagram" | "facebook"

export function usePropertyPDF() {
  const generate = useCallback(async (property: Property, action: ShareAction) => {
    const blob     = await generateImage(property)
    const filename = `${property.title.replace(/\s+/g,"_")}_terrava.png`
    const shareText= [
      property.title,
      "Location: " + property.locationName,
      `Area: ${Math.round(property.totalAreaInSqFt).toLocaleString("en-IN")} sq ft`,
      "Total: Rs." + Math.round(property.totalPrice).toLocaleString("en-IN"),
    ].join("\n")

    switch (action) {
      case "save":
        saveLocally(blob, filename); break
      case "whatsapp": {
        const shared = await shareViaNative(blob, filename, property.title)
        if (!shared) {
          saveLocally(blob, filename)
          setTimeout(() => window.open(
            "https://wa.me/?text=" + encodeURIComponent(shareText + "\n\n(Image saved — attach it in chat)"),
            "_blank"), 600)
        }
        break
      }
      case "instagram": {
        const shared = await shareViaNative(blob, filename, property.title)
        if (!shared) {
          saveLocally(blob, filename)
          alert("Image saved to your device! Open Instagram and share from your gallery.")
        }
        break
      }
      case "facebook": {
        saveLocally(blob, filename)
        setTimeout(() => window.open(
          "https://www.facebook.com/sharer/sharer.php?quote=" + encodeURIComponent(shareText),
          "_blank"), 600)
        break
      }
    }
  }, [])
  return { generate }
}