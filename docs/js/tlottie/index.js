//#region src/worker/pool.ts
var e = class {
	workers = [];
	nextIndex = -1;
	size;
	constructor(e = 1) {
		this.size = Math.max(1, e);
	}
	setSize(e) {
		if (e < 1) throw Error("tlottie: worker pool size must be at least 1");
		for (this.size = e; this.workers.length > e;) this.workers.pop()?.terminate();
	}
	getWorker() {
		if (this.workers.length < this.size) {
			let e = new Worker(new URL(
				/* @vite-ignore */
				"" + new URL("assets/tlottie.worker-DNPzh9QI.js", import.meta.url).href,
				"" + import.meta.url
			), { type: "module" });
			return this.workers.push(e), this.nextIndex = this.workers.length - 1, e;
		}
		return this.nextIndex = (this.nextIndex + 1) % this.workers.length, this.workers[this.nextIndex];
	}
	getAllWorkers() {
		for (; this.workers.length < this.size;) this.getWorker();
		return [...this.workers];
	}
	terminateAll() {
		for (let e of this.workers) e.terminate();
		this.workers = [], this.nextIndex = -1;
	}
}, t = new e(), n = new URL("" + new URL("tlottie.wasm", import.meta.url).href, "" + import.meta.url), r = 0;
function i() {
	return typeof crypto < "u" && typeof crypto.randomUUID == "function" ? crypto.randomUUID() : (r += 1, `tlottie-warmup-${Date.now()}-${r}`);
}
function a(r = {}) {
	let a = r.pool ?? (r.workerCount === void 0 ? t : new e(r.workerCount)), o = (r.wasmUrl ?? n).toString(), s = a.getAllWorkers();
	return Promise.all(s.map((e) => new Promise((t, n) => {
		let r = i(), a = (i) => {
			let o = i.data;
			(o.type === "warmed" || o.type === "warmup-error") && o.requestId === r && (e.removeEventListener("message", a), o.type === "warmed" ? t() : n(Error(o.message)));
		};
		e.addEventListener("message", a), e.postMessage({
			type: "warmup",
			requestId: r,
			wasmUrl: o
		});
	}))).then(() => void 0);
}
//#endregion
//#region src/main/shimmer.ts
function o(e) {
	let t = `url("data:image/svg+xml;base64,${s(e)}")`;
	return {
		maskImage: t,
		WebkitMaskImage: t
	};
}
function s(e) {
	let t = new TextEncoder().encode(e), n = "";
	for (let e = 0; e < t.length; e++) n += String.fromCharCode(t[e]);
	return btoa(n);
}
//#endregion
//#region src/main/cache.ts
var c = /* @__PURE__ */ new Map();
function l(e) {
	let t = c.get(e);
	return t || (t = fetch(e, { cache: "force-cache" }).then((t) => {
		if (!t.ok) throw Error(`tlottie: fetch failed for "${e}" (${t.status})`);
		return t.arrayBuffer();
	}).then((e) => new Uint8Array(e)), t.catch(() => c.delete(e)), c.set(e, t)), t;
}
//#endregion
//#region src/main/TLottie.ts
function u(e) {
	e.workerCount !== void 0 && t.setSize(e.workerCount);
}
var d = /* @__PURE__ */ new Map(), f = typeof IntersectionObserver > "u" ? null : new IntersectionObserver((e) => {
	for (let t of e) {
		let e = t.target.dataset.tlottieId;
		e && d.get(e)?.setObservable(t.isIntersecting);
	}
}), p = 0;
function m() {
	return typeof crypto < "u" && typeof crypto.randomUUID == "function" ? crypto.randomUUID() : (p += 1, `tlottie-${Date.now()}-${p}`);
}
var h = class {
	id = m();
	state = "loading";
	frames = {
		current: 0,
		total: 0
	};
	lastError = null;
	config;
	canvas;
	pool;
	worker = null;
	resizeObserver = null;
	resizeRaf = 0;
	destroyed = !1;
	listeners = /* @__PURE__ */ new Map();
	constructor(n) {
		this.config = n, this.canvas = n.canvas, this.pool = n.pool ?? (n.workerCount === void 0 ? t : new e(n.workerCount)), requestAnimationFrame(() => {
			this.destroyed || this.start();
		});
	}
	on(e, t) {
		let n = this.listeners.get(e);
		n || (n = /* @__PURE__ */ new Set(), this.listeners.set(e, n)), n.add(t);
	}
	off(e, t) {
		this.listeners.get(e)?.delete(t);
	}
	play() {
		this.send({
			type: "control",
			id: this.id,
			action: "play"
		});
	}
	pause() {
		this.send({
			type: "control",
			id: this.id,
			action: "pause"
		});
	}
	stop() {
		this.send({
			type: "control",
			id: this.id,
			action: "stop"
		});
	}
	seek(e) {
		this.send({
			type: "tweak",
			id: this.id,
			action: "seek",
			value: e
		});
	}
	setSpeed(e) {
		this.send({
			type: "tweak",
			id: this.id,
			action: "speed",
			value: e
		});
	}
	setLoop(e) {
		this.send({
			type: "tweak",
			id: this.id,
			action: "loop",
			value: e
		});
	}
	setDirection(e) {
		this.send({
			type: "tweak",
			id: this.id,
			action: "direction",
			value: e
		});
	}
	setFitzModifier(e) {
		this.send({
			type: "recolor",
			id: this.id,
			fitzModifier: e,
			layerColorReplacements: this.config.layerColorReplacements
		});
	}
	setLayerColors(e) {
		this.send({
			type: "recolor",
			id: this.id,
			fitzModifier: this.config.fitzModifier,
			layerColorReplacements: e
		});
	}
	setObservable(e) {
		this.send({
			type: "observability",
			id: this.id,
			observable: e
		});
	}
	destroy() {
		this.destroyed || (this.worker?.postMessage({
			type: "control",
			id: this.id,
			action: "destroy"
		}), this.destroyed = !0, this.worker?.removeEventListener("message", this.onMessage), this.worker = null, this.resizeObserver?.disconnect(), this.resizeObserver = null, this.resizeRaf && cancelAnimationFrame(this.resizeRaf), f?.unobserve(this.canvas), d.delete(this.id), this.listeners.clear());
	}
	start() {
		this.canvas.dataset.tlottieId = this.id;
		let e = this.canvas.transferControlToOffscreen();
		this.worker = this.pool.getWorker(), this.worker.addEventListener("message", this.onMessage), d.set(this.id, this), f?.observe(this.canvas), typeof ResizeObserver < "u" && (this.resizeObserver = new ResizeObserver(() => this.scheduleResize()), this.resizeObserver.observe(this.canvas));
		let { width: t, height: n } = this.measure();
		this.loadAndInit(e, t, n);
	}
	async loadAndInit(e, t, r) {
		let i;
		try {
			i = await this.resolveSourceBytes();
		} catch (e) {
			this.handleError({
				reason: "fetch",
				message: e instanceof Error ? e.message : String(e)
			});
			return;
		}
		if (this.destroyed || !this.worker) return;
		let a = i.slice(), o = {
			type: "init",
			id: this.id,
			config: {
				canvas: e,
				animationData: a,
				wasmUrl: (this.config.wasmUrl ?? n).toString(),
				width: t,
				height: r,
				speed: this.config.speed,
				loop: this.config.loop,
				direction: this.config.direction,
				autoplay: this.config.autoplay,
				fitzModifier: this.config.fitzModifier,
				layerColorReplacements: this.config.layerColorReplacements,
				quality: this.config.quality,
				forceRender: this.config.forceRender,
				reportFrames: this.config.reportFrames
			}
		};
		this.worker.postMessage(o, [e, a.buffer]);
	}
	async resolveSourceBytes() {
		let { data: e, src: t } = this.config;
		if (e !== void 0) return typeof e == "string" ? new TextEncoder().encode(e) : e;
		if (t) return l(t);
		throw Error("tlottie: TLottieConfig requires either `src` or `data`");
	}
	measure() {
		let e = this.canvas.getBoundingClientRect(), t = window.devicePixelRatio || 1;
		return {
			width: Math.max(1, Math.round((e.width || 1) * t)),
			height: Math.max(1, Math.round((e.height || 1) * t))
		};
	}
	scheduleResize() {
		this.resizeRaf ||= requestAnimationFrame(() => {
			if (this.resizeRaf = 0, this.destroyed) return;
			let { width: e, height: t } = this.measure();
			this.send({
				type: "resize",
				id: this.id,
				width: e,
				height: t
			});
		});
	}
	send(e) {
		this.destroyed || !this.worker || this.worker.postMessage(e);
	}
	onMessage = (e) => {
		let t = e.data;
		if (t.type !== "warmed" && t.type !== "warmup-error" && t.id === this.id) switch (t.type) {
			case "meta":
				this.frames = {
					current: 0,
					total: t.frameCount
				}, this.state = "ready", this.emit("load", { frames: this.frames });
				break;
			case "event":
				this.frames = t.frames, this.state = g(t.event, this.state), this.emit(t.event, { frames: t.frames });
				break;
			case "error": this.handleError(t.error);
		}
	};
	handleError(e) {
		this.state = "error", this.lastError = e, this.emit("error", { error: e });
	}
	emit(e, t) {
		let n = this.listeners.get(e);
		if (n) for (let e of n) e(t);
	}
};
function g(e, t) {
	switch (e) {
		case "play": return "playing";
		case "pause": return "paused";
		case "stop": return "stopped";
		case "complete": return "complete";
		default: return t;
	}
}
//#endregion
//#region src/core/types.ts
var _ = {
	None: 0,
	Type12: 1,
	Type3: 2,
	Type4: 3,
	Type5: 4,
	Type6: 5
}, v = {
	antialias: !0,
	curveTolerance: .125
};
//#endregion
//#region src/vanilla/index.ts
function y(e, t) {
	let { outline: n, className: r, playOnClick: i, ...a } = t, s = document.createElement("div");
	s.className = r ? `tlottie-player ${r}` : "tlottie-player";
	let c = document.createElement("canvas");
	s.appendChild(c);
	let l = null;
	if (n) {
		l = document.createElement("div"), l.className = "tlottie-shimmer";
		let e = o(n);
		l.style.setProperty("mask-image", e.maskImage), l.style.setProperty("-webkit-mask-image", e.WebkitMaskImage), s.appendChild(l);
	}
	e.appendChild(s);
	let u = new h({
		...a,
		canvas: c
	}), d = i ? () => u.play() : null;
	d && c.addEventListener("click", d);
	let f = () => {
		c.classList.add("tlottie-ready"), l?.classList.add("tlottie-hidden");
	}, p = () => {
		c.classList.remove("tlottie-ready"), l?.classList.remove("tlottie-hidden");
	};
	return u.on("load", f), u.on("error", p), {
		tlottie: u,
		element: s,
		canvas: c,
		destroy() {
			u.off("load", f), u.off("error", p), d && c.removeEventListener("click", d), u.destroy(), s.remove();
		}
	};
}
//#endregion
export { v as DEFAULT_RENDER_QUALITY, _ as FitzModifier, h as TLottie, u as configureTLottie, y as createTLottiePlayer, a as initializeTLottie };
