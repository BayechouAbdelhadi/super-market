/**
 * Utilitaire de rendu Canvas HD, Téléchargement et Impression pour l'Affiche de Fidélité
 * Utilise le visuel officiel template-fidelity-qr-base.jpeg
 * et incruste le QR Code dynamique en haute définition au centre.
 */

/**
 * Charge une image de manière asynchrone et sécurisée sans blocage d'événement
 */
function loadImageSafely(src: string, crossOrigin?: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    if (crossOrigin) {
      img.crossOrigin = crossOrigin;
    }
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
    if (img.complete && img.naturalWidth > 0) {
      resolve(img);
    }
  });
}

/**
 * Récupère le fond de l'affiche via Blob URL pour garantir une compatibilité canvas totale
 */
async function loadBasePosterImage(): Promise<HTMLImageElement> {
  try {
    const res = await fetch("/template-fidelity-qr-base.jpeg", { cache: "force-cache" });
    if (res.ok) {
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const img = new window.Image();
      return await new Promise<HTMLImageElement>((resolve, reject) => {
        img.onload = () => {
          URL.revokeObjectURL(objectUrl);
          resolve(img);
        };
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          reject(new Error("Échec du chargement du blob affiche"));
        };
        img.src = objectUrl;
        if (img.complete && img.naturalWidth > 0) {
          URL.revokeObjectURL(objectUrl);
          resolve(img);
        }
      });
    }
  } catch (err) {
    console.warn("[loadBasePosterImage] Fetch blob a échoué, repli sur chargement direct:", err);
  }

  // Fallback direct
  return await loadImageSafely("/template-fidelity-qr-base.jpeg", "anonymous");
}

export async function drawFidelityFlyerOnCanvas(
  canvas: HTMLCanvasElement,
  qrDataUrl: string,
  _finalUrl?: string,
  _options?: {
    storeName?: string;
    storeAddress?: string;
    siteUrl?: string;
  }
): Promise<void> {
  canvas.width = 1024;
  canvas.height = 1536;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // 1. Fond officiel de l'affiche
  try {
    const baseImg = await loadBasePosterImage();
    ctx.drawImage(baseImg, 0, 0, 1024, 1536);
  } catch (err) {
    console.error("[drawFidelityFlyerOnCanvas] Impossible de charger le fond officiel:", err);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 1024, 1536);
  }

  // 2. Charger et dessiner le QR Code dynamique au centre exact du cadre
  if (qrDataUrl) {
    try {
      const qrImg = new window.Image();
      await new Promise<void>((resolve) => {
        qrImg.onload = () => resolve();
        qrImg.onerror = () => resolve();
        qrImg.src = qrDataUrl;
        if (qrImg.complete && qrImg.naturalWidth > 0) {
          resolve();
        }
      });

      // Emplacement du cadre : x in [352, 672], y in [625, 975], centre = (512, 800)
      const qrSize = 250;
      const qrX = Math.round(512 - qrSize / 2);
      const qrY = Math.round(800 - qrSize / 2);

      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
    } catch (qrErr) {
      console.warn("[drawFidelityFlyerOnCanvas] Erreur incrustation QR Code:", qrErr);
    }
  }
}

/**
 * Télécharge un Canvas au format PNG de manière robuste (compatible Chrome, Safari, Firefox, iOS)
 * Évite les blocages de data: URLs volumineux grâce à canvas.toBlob()
 */
export async function downloadCanvasAsPng(
  canvas: HTMLCanvasElement,
  filename: string = "affiche-fidelite-supermarket-calais.png"
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    // Méthode standard préférée : toBlob
    if (typeof canvas.toBlob === "function") {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            triggerDataUrlFallback();
            return;
          }
          try {
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.style.display = "none";
            a.download = filename;
            a.href = blobUrl;
            a.rel = "noopener";
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
              if (document.body.contains(a)) document.body.removeChild(a);
              URL.revokeObjectURL(blobUrl);
            }, 3000);
            resolve();
          } catch (e) {
            console.warn("[downloadCanvasAsPng] toBlob download échoué, essai dataURL:", e);
            triggerDataUrlFallback();
          }
        },
        "image/png",
        1.0
      );
      return;
    }

    triggerDataUrlFallback();

    function triggerDataUrlFallback() {
      try {
        const dataUrl = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.style.display = "none";
        a.download = filename;
        a.href = dataUrl;
        a.rel = "noopener";
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          if (document.body.contains(a)) document.body.removeChild(a);
        }, 1500);
        resolve();
      } catch (err) {
        reject(err);
      }
    }
  });
}

/**
 * Imprime l'affiche officielle complète (ou Enregistrer au format PDF)
 * Résout définitivement le problème de page blanche dans la boîte d'impression
 * en injectant l'image haute définition directement dans le document d'impression.
 */
export async function printFidelityFlyer(
  qrDataUrl: string,
  inviteUrl?: string
): Promise<void> {
  const canvas = document.createElement("canvas");
  await drawFidelityFlyerOnCanvas(canvas, qrDataUrl, inviteUrl);

  const posterDataUrl = canvas.toDataURL("image/png");

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.style.opacity = "0";
  iframe.style.pointerEvents = "none";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="utf-8" />
        <title>Affiche Fidélité - Super Market Calais</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 6mm auto;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: 100% !important;
            background: #ffffff !important;
            overflow: hidden !important;
          }
          body {
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
          }
          img.poster-img {
            display: block !important;
            width: auto !important;
            height: auto !important;
            max-width: 95vw !important;
            max-height: 96vh !important;
            object-fit: contain !important;
            margin: auto !important;
            border-radius: 12px !important;
          }
        </style>
      </head>
      <body>
        <img class="poster-img" id="poster-img" src="${posterDataUrl}" alt="Affiche Fidélité Super Market" />
      </body>
    </html>
  `);
  doc.close();

  const img = doc.getElementById("poster-img") as HTMLImageElement | null;
  const pri = iframe.contentWindow;
  if (!pri) return;

  const trigger = () => {
    try {
      pri.focus();
      pri.print();
    } catch (e) {
      console.error("Print error:", e);
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 2500);
    }
  };

  if (img && !img.complete) {
    img.onload = () => setTimeout(trigger, 150);
    img.onerror = () => setTimeout(trigger, 150);
  } else {
    setTimeout(trigger, 150);
  }
}
