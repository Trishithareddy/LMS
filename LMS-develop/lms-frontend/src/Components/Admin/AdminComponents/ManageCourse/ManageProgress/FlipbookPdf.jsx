
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  Box,
  CircularProgress,
  Typography,
  Button,
  IconButton,
  TextField,
  Tooltip,
  Divider,
} from "@mui/material";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import HTMLFlipBook from "react-pageflip";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";

// point to the local .mjs worker in public/
pdfjsLib.GlobalWorkerOptions.workerSrc = `${window.location.origin}/pdf.worker.min.mjs`;

function FlipbookPdf({ pdfUrl, avgSecondsPerPage = 20 }) {
  const [pageImages, setPageImages] = useState([]); // data URLs
  const [loading, setLoading] = useState(true);
  const [pageCount, setPageCount] = useState(0);
  const [error, setError] = useState(null);
  const [zoom, setZoom] = useState(1); // 1 = 100%
  const [thumbsOpen, setThumbsOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const flipbookRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!pdfUrl) return;
    const isHttp = pdfUrl.startsWith("http://") || pdfUrl.startsWith("https://");
    const isPublic = pdfUrl.startsWith("/") || pdfUrl.includes("/ebooks/");
    if (!isHttp && !isPublic) {
      setError("Flipbook expects a public PDF URL. Provide a valid URL or public path.");
      setLoading(false);
      console.warn("FlipbookPdf: refusing to fetch non-URL pdfUrl=", pdfUrl);
      return;
    }

    let cancelled = false;

    const fetchArrayBuffer = async (url) => {
      try {
        const axiosResp = await axios.get(url, {
          responseType: "arraybuffer",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        });
        if (axiosResp && axiosResp.status === 200 && axiosResp.data && axiosResp.data.byteLength > 0)
          return axiosResp.data;
        console.warn(
          "Axios returned no bytes (status " + (axiosResp ? axiosResp.status : "unknown") + "). Falling back to fetch(no-store)."
        );
      } catch (err) {
        console.warn("Axios fetch failed, falling back to fetch():", err);
      }

      const fetchResp = await fetch(url, { cache: "no-store", mode: "cors" });
      if (!fetchResp.ok) throw new Error(`fetch failed: ${fetchResp.status}`);
      return await fetchResp.arrayBuffer();
    };

    const loadAndRender = async () => {
      setLoading(true);
      setError(null);
      setPageImages([]);

      try {
        const arrayBuffer = await fetchArrayBuffer(pdfUrl);
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        if (cancelled) return;
        setPageCount(pdf.numPages);

        const renderPageToDataURL = async (pageNum, scale = 1.5) => {
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext("2d");
          await page.render({ canvasContext: ctx, viewport }).promise;
          return canvas.toDataURL("image/jpeg", 0.9);
        };

        // render first two pages fast
        const first = [];
        for (let i = 1; i <= Math.min(2, pdf.numPages); i++) first.push(renderPageToDataURL(i));
        const firstImgs = await Promise.all(first);
        if (cancelled) return;

        setPageImages(firstImgs);

        // create placeholders while background renders (optional)
        if (pdf.numPages > firstImgs.length) {
          setPageImages((prev) => {
            const placeholders = prev.slice(); // already has firstImgs
            // add small placeholders equal to remaining pages so flipbook can mount quickly
            for (let i = prev.length; i < Math.min(6, pdf.numPages); i++) placeholders.push(prev[0]);
            return placeholders;
          });
        }

        // background render remaining pages in batches to avoid blocking
        const rest = [];
        for (let i = 3; i <= pdf.numPages; i++) rest.push(renderPageToDataURL(i));
        const restImgs = await Promise.all(rest);
        if (cancelled) return;
        setPageImages((prev) => {
          // if prev already had placeholders, replace them with real pages by concatenation
          // ensure we don't duplicate first pages
          const combined = [...(prev.slice(0, Math.min(prev.length, 2))), ...restImgs];
          return combined;
        });
      } catch (err) {
        console.error(err);
        setError("Unable to load PDF. Check URL/CORS or server.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadAndRender();
    return () => {
      cancelled = true;
    };
  }, [pdfUrl]);

  const estimatedTimeMins = Math.round(((pageCount * avgSecondsPerPage) / 60) * 10) / 10;

  // flip handlers
  const handleFlip = (e) => {
    // pageFlip gives 0-based index
    const idx = e.data + 1;
    setCurrentPage(idx);
  };

  const prevPage = () => {
    try {
      flipbookRef.current.pageFlip().flipPrev();
    } catch (e) {}
  };
  const nextPage = () => {
    try {
      flipbookRef.current.pageFlip().flipNext();
    } catch (e) {}
  };
  const gotoPage = (num) => {
    if (!flipbookRef.current) return;
    try {
      const idx = Math.max(0, Math.min(pageCount - 1, num - 1));
      flipbookRef.current.pageFlip().flip(idx);
    } catch (e) {}
  };

  // zoom controls
  const handleZoomIn = () => setZoom((z) => Math.min(2.5, +(z + 0.1).toFixed(2)));
  const handleZoomOut = () => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2)));
  const handleResetZoom = () => setZoom(1);

  // fullscreen
  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // basic UI states
  if (!pdfUrl) {
    return <Typography>No e-book URL provided</Typography>;
  }

  if (loading && pageImages.length === 0) {
    return (
      <Box sx={{ textAlign: "center", p: 4 }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Preparing flipbook...</Typography>
      </Box>
    );
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Box ref={containerRef} sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 2 }}>
      {/* header - green KIPS-like bar */}
      <Box
        sx={{
          background: "linear-gradient(90deg,#0f6b45,#2aa35b)",
          color: "white",
          px: 3,
          py: 1.5,
          borderRadius: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box component="img" src="/kips-logo.png" alt="logo" sx={{ height: 36 }} onError={(e) => (e.currentTarget.style.display = "none")} />
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              EBOOK
            </Typography>
            <Typography variant="caption">
              Flipbook view — pages: {pageCount} • Estimated time: {estimatedTimeMins} mins
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <TextField size="small" placeholder="Search" sx={{ bgcolor: "white", borderRadius: 1, minWidth: 200 }} />
          <Tooltip title="Zoom Out">
            <IconButton onClick={handleZoomOut} sx={{ color: "white" }}>
              <ZoomOutIcon />
            </IconButton>
          </Tooltip>
          <Typography sx={{ color: "white", minWidth: 36, textAlign: "center" }}>{Math.round(zoom * 100)}%</Typography>
          <Tooltip title="Zoom In">
            <IconButton onClick={handleZoomIn} sx={{ color: "white" }}>
              <ZoomInIcon />
            </IconButton>
          </Tooltip>
          <Button variant="contained" color="success" onClick={handleResetZoom} sx={{ textTransform: "none" }}>
            Reset
          </Button>

          <Tooltip title="Toggle Thumbnails">
            <IconButton onClick={() => setThumbsOpen((t) => !t)} sx={{ color: "white" }}>
              <PhotoLibraryIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
            <IconButton onClick={toggleFullscreen} sx={{ color: "white" }}>
              {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* main flipbook area */}
      <Box sx={{ display: "flex", gap: 2, alignItems: "stretch", px: 2 }}>
        {/* left arrow (mobile hidden) */}
        <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center" }}>
          <IconButton onClick={prevPage} sx={{ bgcolor: "#0f6b45", color: "white", "&:hover": { bgcolor: "#0e5e3f" } }}>
            <ArrowBackIosNewIcon />
          </IconButton>
        </Box>

        {/* flipbook container with green background */}
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Box
            sx={{
              width: "100%",
              maxWidth: 1100,
              bgcolor: "rgba(15,107,69,0.08)",
              borderRadius: 2,
              p: 3,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Box
              sx={{
                transform: `scale(${zoom})`,
                transformOrigin: "center top",
                transition: "transform 200ms ease",
                bg: "white",
              }}
            >
              <Box
                sx={{
                  width: 880,
                  height: 560,
                  bgcolor: "white",
                  borderRadius: 1,
                  boxShadow: 3,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {pageImages.length === 0 ? (
                  <Box sx={{ textAlign: "center" }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <HTMLFlipBook
                    width={800}
                    height={540}
                    size="stretch"
                    minWidth={300}
                    maxWidth={1000}
                    minHeight={300}
                    maxHeight={1200}
                    maxShadowOpacity={0.5}
                    showCover={false}
                    ref={flipbookRef}
                    onFlip={handleFlip}
                    className="demo-book"
                  >
                    {pageImages.map((dataUrl, idx) => (
                      <div
                        key={idx}
                        className="demo-page"
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          background: "#fff",
                          width: "100%",
                          height: "100%",
                        }}
                      >
                        <img src={dataUrl} alt={`page ${idx + 1}`} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                      </div>
                    ))}
                  </HTMLFlipBook>
                )}
              </Box>
            </Box>

            {/* controls below flipbook */}
            <Box sx={{ mt: 2, width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <Button variant="outlined" onClick={prevPage} startIcon={<ArrowBackIosNewIcon />} sx={{ textTransform: "none" }}>
                  PREV
                </Button>
                <Button variant="contained" onClick={nextPage} endIcon={<ArrowForwardIosIcon />} sx={{ textTransform: "none" }}>
                  NEXT
                </Button>

                <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

                <Typography variant="body2">Page</Typography>
                <TextField
                  size="small"
                  sx={{ width: 80 }}
                  value={currentPage}
                  onChange={(e) => {
                    const v = Number(e.target.value || 1);
                    if (!Number.isNaN(v)) setCurrentPage(v);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      gotoPage(Number(currentPage));
                    }
                  }}
                />
                <Typography variant="body2"> / {pageCount}</Typography>
              </Box>

              <Typography variant="body2" color="textSecondary">
                Estimated time: {estimatedTimeMins} mins
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* right arrow (mobile hidden) */}
        <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center" }}>
          <IconButton onClick={nextPage} sx={{ bgcolor: "#0f6b45", color: "white", "&:hover": { bgcolor: "#0e5e3f" } }}>
            <ArrowForwardIosIcon />
          </IconButton>
        </Box>
      </Box>

      {/* thumbnails */}
      {thumbsOpen && pageImages && pageImages.length > 0 && (
        <Box sx={{ px: 3 }}>
          <Box
            sx={{
              bgcolor: "background.paper",
              borderRadius: 1,
              p: 1,
              display: "flex",
              gap: 1,
              overflowX: "auto",
            }}
          >
            {pageImages.map((src, i) => (
              <Box key={i} sx={{ flex: "0 0 auto", textAlign: "center" }}>
                <Button
                  onClick={() => {
                    gotoPage(i + 1);
                  }}
                  sx={{
                    p: 0,
                    borderRadius: 1,
                    border: currentPage === i + 1 ? "2px solid #0f6b45" : "1px solid transparent",
                    minWidth: 90,
                    minHeight: 120,
                  }}
                >
                  <Box component="img" src={src} alt={`thumb-${i + 1}`} sx={{ width: 90, height: 120, objectFit: "cover", borderRadius: 0.5 }} />
                </Button>
                <Typography variant="caption" display="block">
                  {i + 1}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default FlipbookPdf;
