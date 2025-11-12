import base64

from pathlib import Path



fonts = [

    ("public/fonts/NotoSansKR-Regular.ttf", "NotoSansKR", "normal"),

    ("public/fonts/NotoSansKR-Bold.ttf", "NotoSansKR", "bold"),

]



out_dir = Path("public/fonts")

out_dir.mkdir(parents=True, exist_ok=True)



for ttf_path, font_family, style in fonts:

    ttf = Path(ttf_path)

    if not ttf.exists():

        print("❌ Font missing:", ttf)

        continue



    b64 = base64.b64encode(ttf.read_bytes()).decode("ascii")

    js_out = out_dir / f"{ttf.stem}-base64.js"



    js_out.write_text(f"""

(function() {{

  if(!window.jspdf) {{

    console.warn("jsPDF not loaded yet - waiting...");

  }}

  const fontData = "{b64}";

  const ttfName = "{ttf.name}";

  const family = "{font_family}";

  const style = "{style}";



  if (window.jspdf?.API?.addFileToVFS) {{

    window.jspdf.API.addFileToVFS(ttfName, fontData);

    window.jspdf.API.addFont(ttfName, family, style);

    console.log("✅ Font loaded:", family, style);

  }} else {{

    window._pdfFonts = window._pdfFonts || [];

    window._pdfFonts.push({{ ttfName, fontData, family, style }});

  }}

}})();

""")

    print("✅ Generated:", js_out)

