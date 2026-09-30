const PYODIDE_INDEX_URL = "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/";

const PACKAGE_MAP = {
    numpy: "numpy",
    pandas: "pandas",
    matplotlib: "matplotlib",
    scipy: "scipy",
    sympy: "sympy",
    sklearn: "scikit-learn",
    PIL: "pillow",
    networkx: "networkx",
};

let pyodidePromise = null;

export const getPyodideInstance = async () => {
    if (pyodidePromise) return pyodidePromise;

    pyodidePromise = (async () => {
        if (window.languagePluginLoader) {
            return window.languagePluginLoader;
        }

        if (typeof window.loadPyodide === "function") {
            return window.loadPyodide({ indexURL: PYODIDE_INDEX_URL });
        }

        throw new Error("Pyodide is not loaded. Please refresh the page and try again.");
    })();

    return pyodidePromise;
};

const findRequestedPackages = (code = "") => {
    const packages = new Set();
    const importRegex = /^\s*(?:import\s+([a-zA-Z_][\w.]*)|from\s+([a-zA-Z_][\w.]*)\s+import)\b/gm;
    let match;

    while ((match = importRegex.exec(code))) {
        const rootName = (match[1] || match[2] || "").split(".")[0];
        const packageName = PACKAGE_MAP[rootName];
        if (packageName) packages.add(packageName);
    }

    return [...packages];
};

const loadRequestedPackages = async (pyodide, code) => {
    const packages = findRequestedPackages(code);
    const warnings = [];

    for (const packageName of packages) {
        try {
            await pyodide.loadPackage(packageName);
        } catch (error) {
            warnings.push(`Could not load package "${packageName}": ${error.message || error}`);
        }
    }

    return warnings;
};

const TURTLE_SVG_START = "__SUPERTEACHER_TURTLE_SVG_START__";
const TURTLE_SVG_END = "__SUPERTEACHER_TURTLE_SVG_END__";

const installBrowserTurtle = (pyodide) => {
    pyodide.runPython(`
import math
import sys
import types

_superteacher_turtle_shapes = []

class __SuperTeacherTurtle:
    def __init__(self):
        self.x = 0.0
        self.y = 0.0
        self._heading = 0.0
        self.is_down = True
        self.pen_color = "black"
        self.pen_width = 2

    def _line_to(self, x, y):
        old_x, old_y = self.x, self.y
        self.x, self.y = float(x), float(y)
        if self.is_down:
            _superteacher_turtle_shapes.append({
                "type": "line",
                "x1": old_x,
                "y1": old_y,
                "x2": self.x,
                "y2": self.y,
                "color": self.pen_color,
                "width": self.pen_width,
            })

    def forward(self, distance):
        radians = math.radians(self._heading)
        self._line_to(
            self.x + math.cos(radians) * float(distance),
            self.y + math.sin(radians) * float(distance),
        )

    fd = forward

    def backward(self, distance):
        self.forward(-float(distance))

    back = backward
    bk = backward

    def right(self, angle):
        self._heading -= float(angle)

    rt = right

    def left(self, angle):
        self._heading += float(angle)

    lt = left

    def penup(self):
        self.is_down = False

    pu = penup
    up = penup

    def pendown(self):
        self.is_down = True

    pd = pendown
    down = pendown

    def goto(self, x, y=None):
        if y is None and isinstance(x, (tuple, list)):
            x, y = x
        self._line_to(x, y)

    setpos = goto
    setposition = goto

    def setx(self, x):
        self._line_to(x, self.y)

    def sety(self, y):
        self._line_to(self.x, y)

    def setheading(self, angle):
        self._heading = float(angle)

    seth = setheading

    def home(self):
        self.goto(0, 0)
        self._heading = 0

    def color(self, *args):
        if args:
            self.pen_color = str(args[0])
        return self.pen_color

    pencolor = color

    def pensize(self, width=None):
        if width is not None:
            self.pen_width = float(width)
        return self.pen_width

    width = pensize

    def circle(self, radius, extent=None, steps=None):
        radius = float(radius)
        extent = 360 if extent is None else float(extent)
        steps = int(steps or max(18, abs(extent) // 10))
        start_heading = self._heading
        cx = self.x - math.sin(math.radians(self._heading)) * radius
        cy = self.y + math.cos(math.radians(self._heading)) * radius
        start_angle = math.degrees(math.atan2(self.y - cy, self.x - cx))
        for step in range(1, steps + 1):
            angle = start_angle + (extent * step / steps)
            self._line_to(
                cx + math.cos(math.radians(angle)) * abs(radius),
                cy + math.sin(math.radians(angle)) * abs(radius),
            )
        self._heading = start_heading + extent

    def speed(self, value=None):
        return 0

    def hideturtle(self):
        pass

    ht = hideturtle

    def showturtle(self):
        pass

    st = showturtle

    def clear(self):
        _superteacher_turtle_shapes.clear()

    def reset(self):
        self.clear()
        self.__init__()

    def position(self):
        return (self.x, self.y)

    pos = position

    def xcor(self):
        return self.x

    def ycor(self):
        return self.y

    def heading(self):
        return self._heading

_superteacher_default_turtle = __SuperTeacherTurtle()

def _superteacher_svg_escape(value):
    return str(value).replace("&", "&amp;").replace('"', "&quot;").replace("<", "&lt;").replace(">", "&gt;")

def _superteacher_turtle_svg():
    if not _superteacher_turtle_shapes:
        return ""
    width = 640
    height = 420
    center_x = width / 2
    center_y = height / 2
    parts = [
        f'<div class="superteacher-turtle-wrap" style="margin-top:12px;padding:12px;border:1px solid #d1d5db;border-radius:8px;background:#fff;">',
        f'<div style="font-weight:700;margin-bottom:8px;color:#111827;">Turtle Output</div>',
        f'<svg width="100%" height="{height}" viewBox="0 0 {width} {height}" xmlns="http://www.w3.org/2000/svg" style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:6px;">',
        f'<line x1="{center_x}" y1="0" x2="{center_x}" y2="{height}" stroke="#e5e7eb" stroke-width="1"/>',
        f'<line x1="0" y1="{center_y}" x2="{width}" y2="{center_y}" stroke="#e5e7eb" stroke-width="1"/>',
    ]
    for shape in _superteacher_turtle_shapes:
        if shape["type"] == "line":
            parts.append(
                f'<line x1="{center_x + shape["x1"]}" y1="{center_y - shape["y1"]}" x2="{center_x + shape["x2"]}" y2="{center_y - shape["y2"]}" stroke="{_superteacher_svg_escape(shape["color"])}" stroke-width="{shape["width"]}" stroke-linecap="round"/>'
            )
    parts.append("</svg></div>")
    return "".join(parts)

def _superteacher_make_turtle_module():
    module = types.ModuleType("turtle")
    module.Turtle = __SuperTeacherTurtle
    module.Pen = __SuperTeacherTurtle
    module.RawTurtle = __SuperTeacherTurtle
    module.Screen = lambda: types.SimpleNamespace(
        bgcolor=lambda *args, **kwargs: None,
        setup=lambda *args, **kwargs: None,
        title=lambda *args, **kwargs: None,
        exitonclick=lambda *args, **kwargs: None,
        mainloop=lambda *args, **kwargs: None,
    )
    for name in [
        "forward", "fd", "backward", "back", "bk", "right", "rt", "left", "lt",
        "penup", "pu", "up", "pendown", "pd", "down", "goto", "setpos",
        "setposition", "setx", "sety", "setheading", "seth", "home", "color",
        "pencolor", "pensize", "width", "circle", "speed", "hideturtle", "ht",
        "showturtle", "st", "clear", "reset", "position", "pos", "xcor", "ycor"
    ]:
        setattr(module, name, getattr(_superteacher_default_turtle, name))
    module.done = lambda *args, **kwargs: None
    module.mainloop = lambda *args, **kwargs: None
    module.exitonclick = lambda *args, **kwargs: None
    return module

sys.modules["turtle"] = _superteacher_make_turtle_module()
`);
};

export const runPythonCode = async (pyodide, code) => {
    const packageWarnings = await loadRequestedPackages(pyodide, code);
    installBrowserTurtle(pyodide);

    pyodide.globals.set("__superteacher_prompt_input", (promptText = "") => {
        const value = window.prompt(promptText || "Input value");

        if (value === null) {
            throw new Error("Input cancelled by user.");
        }

        return value;
    });

    pyodide.runPython(`
import builtins
import sys
from io import StringIO

sys.stdout = StringIO()
sys.stderr = sys.stdout

def __superteacher_input(prompt=""):
    if prompt:
        print(prompt, end="")
    value = __superteacher_prompt_input(prompt or "Input value")
    print(value)
    return value

builtins.input = __superteacher_input
`);

    await pyodide.runPythonAsync(code || "");
    const output = pyodide.runPython("sys.stdout.getvalue()");
    const turtleSvg = pyodide.runPython("_superteacher_turtle_svg()");
    const finalOutput = turtleSvg
        ? `${output}\n${TURTLE_SVG_START}\n${turtleSvg}\n${TURTLE_SVG_END}`
        : output;

    return [...packageWarnings, finalOutput].filter(Boolean).join(packageWarnings.length ? "\n" : "");
};

export const formatPythonOutputHtml = (text = "") =>
    String(text)
        .split(TURTLE_SVG_START)
        .map((part, index) => {
            if (index === 0) {
                return part
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .replace(/\n/g, "<br>")
                    .replace(/ /g, "&nbsp;");
            }

            const [svg, rest = ""] = part.split(TURTLE_SVG_END);
            const escapedRest = rest
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/\n/g, "<br>")
                .replace(/ /g, "&nbsp;");

            return `${svg}${escapedRest}`;
        })
        .join("");

export const formatPlainPythonOutputHtml = (text = "") =>
    String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br>")
        .replace(/ /g, "&nbsp;");
