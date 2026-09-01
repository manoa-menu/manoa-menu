type MatrixInit = {
  a?: number;
  b?: number;
  c?: number;
  d?: number;
  e?: number;
  f?: number;
  m11?: number;
  m12?: number;
  m13?: number;
  m14?: number;
  m21?: number;
  m22?: number;
  m23?: number;
  m24?: number;
  m31?: number;
  m32?: number;
  m33?: number;
  m34?: number;
  m41?: number;
  m42?: number;
  m43?: number;
  m44?: number;
};

type PointInit = {
  x?: number;
  y?: number;
  z?: number;
  w?: number;
};

/** 2D/3D matrix used by pdf.js text extraction on Node, where DOMMatrix is missing. */
class PdfDomMatrix {
  m11 = 1;
  m12 = 0;
  m13 = 0;
  m14 = 0;
  m21 = 0;
  m22 = 1;
  m23 = 0;
  m24 = 0;
  m31 = 0;
  m32 = 0;
  m33 = 1;
  m34 = 0;
  m41 = 0;
  m42 = 0;
  m43 = 0;
  m44 = 1;

  constructor(init?: string | number[] | Float32Array | Float64Array | MatrixInit) {
    if (init === undefined) {
      return;
    }
    if (typeof init === 'string') {
      this.applyCss(init);
      return;
    }
    if (ArrayBuffer.isView(init) || Array.isArray(init)) {
      this.applySequence(Array.from(init));
      return;
    }
    this.copyFrom(init);
  }

  get a(): number {
    return this.m11;
  }

  set a(value: number) {
    this.m11 = value;
  }

  get b(): number {
    return this.m12;
  }

  set b(value: number) {
    this.m12 = value;
  }

  get c(): number {
    return this.m21;
  }

  set c(value: number) {
    this.m21 = value;
  }

  get d(): number {
    return this.m22;
  }

  set d(value: number) {
    this.m22 = value;
  }

  get e(): number {
    return this.m41;
  }

  set e(value: number) {
    this.m41 = value;
  }

  get f(): number {
    return this.m42;
  }

  set f(value: number) {
    this.m42 = value;
  }

  get isIdentity(): boolean {
    return this.m11 === 1 && this.m12 === 0 && this.m13 === 0 && this.m14 === 0
      && this.m21 === 0 && this.m22 === 1 && this.m23 === 0 && this.m24 === 0
      && this.m31 === 0 && this.m32 === 0 && this.m33 === 1 && this.m34 === 0
      && this.m41 === 0 && this.m42 === 0 && this.m43 === 0 && this.m44 === 1;
  }

  get is2D(): boolean {
    return this.m13 === 0 && this.m14 === 0
      && this.m23 === 0 && this.m24 === 0
      && this.m31 === 0 && this.m32 === 0 && this.m33 === 1 && this.m34 === 0
      && this.m43 === 0 && this.m44 === 1;
  }

  static fromMatrix(init?: MatrixInit): PdfDomMatrix {
    return new PdfDomMatrix(init);
  }

  static fromFloat32Array(array: Float32Array): PdfDomMatrix {
    return new PdfDomMatrix(array);
  }

  static fromFloat64Array(array: Float64Array): PdfDomMatrix {
    return new PdfDomMatrix(array);
  }

  multiply(other?: MatrixInit): PdfDomMatrix {
    return this.clone().multiplySelf(other);
  }

  multiplySelf(other?: MatrixInit): this {
    const right = new PdfDomMatrix(other);
    const m11 = this.m11 * right.m11 + this.m21 * right.m12 + this.m31 * right.m13 + this.m41 * right.m14;
    const m12 = this.m12 * right.m11 + this.m22 * right.m12 + this.m32 * right.m13 + this.m42 * right.m14;
    const m13 = this.m13 * right.m11 + this.m23 * right.m12 + this.m33 * right.m13 + this.m43 * right.m14;
    const m14 = this.m14 * right.m11 + this.m24 * right.m12 + this.m34 * right.m13 + this.m44 * right.m14;
    const m21 = this.m11 * right.m21 + this.m21 * right.m22 + this.m31 * right.m23 + this.m41 * right.m24;
    const m22 = this.m12 * right.m21 + this.m22 * right.m22 + this.m32 * right.m23 + this.m42 * right.m24;
    const m23 = this.m13 * right.m21 + this.m23 * right.m22 + this.m33 * right.m23 + this.m43 * right.m24;
    const m24 = this.m14 * right.m21 + this.m24 * right.m22 + this.m34 * right.m23 + this.m44 * right.m24;
    const m31 = this.m11 * right.m31 + this.m21 * right.m32 + this.m31 * right.m33 + this.m41 * right.m34;
    const m32 = this.m12 * right.m31 + this.m22 * right.m32 + this.m32 * right.m33 + this.m42 * right.m34;
    const m33 = this.m13 * right.m31 + this.m23 * right.m32 + this.m33 * right.m33 + this.m43 * right.m34;
    const m34 = this.m14 * right.m31 + this.m24 * right.m32 + this.m34 * right.m33 + this.m44 * right.m34;
    const m41 = this.m11 * right.m41 + this.m21 * right.m42 + this.m31 * right.m43 + this.m41 * right.m44;
    const m42 = this.m12 * right.m41 + this.m22 * right.m42 + this.m32 * right.m43 + this.m42 * right.m44;
    const m43 = this.m13 * right.m41 + this.m23 * right.m42 + this.m33 * right.m43 + this.m43 * right.m44;
    const m44 = this.m14 * right.m41 + this.m24 * right.m42 + this.m34 * right.m43 + this.m44 * right.m44;
    this.m11 = m11; this.m12 = m12; this.m13 = m13; this.m14 = m14;
    this.m21 = m21; this.m22 = m22; this.m23 = m23; this.m24 = m24;
    this.m31 = m31; this.m32 = m32; this.m33 = m33; this.m34 = m34;
    this.m41 = m41; this.m42 = m42; this.m43 = m43; this.m44 = m44;
    return this;
  }

  preMultiplySelf(other?: MatrixInit): this {
    const left = new PdfDomMatrix(other);
    const result = left.multiplySelf(this);
    this.copyFrom(result);
    return this;
  }

  translate(tx = 0, ty = 0, tz = 0): PdfDomMatrix {
    return this.clone().translateSelf(tx, ty, tz);
  }

  translateSelf(tx = 0, ty = 0, tz = 0): this {
    return this.multiplySelf(new PdfDomMatrix([1, 0, 0, 1, tx, ty]).alsoZ(tz));
  }

  scale(sx = 1, sy = sx, sz = 1): PdfDomMatrix {
    return this.clone().scaleSelf(sx, sy, sz);
  }

  scaleSelf(sx = 1, sy = sx, sz = 1): this {
    this.m11 *= sx; this.m12 *= sx; this.m13 *= sx; this.m14 *= sx;
    this.m21 *= sy; this.m22 *= sy; this.m23 *= sy; this.m24 *= sy;
    this.m31 *= sz; this.m32 *= sz; this.m33 *= sz; this.m34 *= sz;
    return this;
  }

  inverse(): PdfDomMatrix {
    return this.clone().invertSelf();
  }

  invertSelf(): this {
    const det = this.m11 * this.m22 - this.m12 * this.m21;
    if (det === 0) {
      this.m11 = NaN; this.m12 = NaN; this.m13 = NaN; this.m14 = NaN;
      this.m21 = NaN; this.m22 = NaN; this.m23 = NaN; this.m24 = NaN;
      this.m31 = NaN; this.m32 = NaN; this.m33 = NaN; this.m34 = NaN;
      this.m41 = NaN; this.m42 = NaN; this.m43 = NaN; this.m44 = NaN;
      return this;
    }
    const { m11, m12, m21, m22, m41, m42 } = this;
    this.m11 = m22 / det;
    this.m12 = -m12 / det;
    this.m21 = -m21 / det;
    this.m22 = m11 / det;
    this.m41 = (m21 * m42 - m22 * m41) / det;
    this.m42 = (m12 * m41 - m11 * m42) / det;
    return this;
  }

  transformPoint(point: PointInit = {}): { x: number; y: number; z: number; w: number } {
    const x = point.x ?? 0;
    const y = point.y ?? 0;
    const z = point.z ?? 0;
    const w = point.w ?? 1;
    return {
      x: this.m11 * x + this.m21 * y + this.m31 * z + this.m41 * w,
      y: this.m12 * x + this.m22 * y + this.m32 * z + this.m42 * w,
      z: this.m13 * x + this.m23 * y + this.m33 * z + this.m43 * w,
      w: this.m14 * x + this.m24 * y + this.m34 * z + this.m44 * w,
    };
  }

  toFloat32Array(): Float32Array {
    return Float32Array.from([
      this.m11, this.m12, this.m13, this.m14,
      this.m21, this.m22, this.m23, this.m24,
      this.m31, this.m32, this.m33, this.m34,
      this.m41, this.m42, this.m43, this.m44,
    ]);
  }

  private alsoZ(tz: number): this {
    this.m43 = tz;
    return this;
  }

  private clone(): PdfDomMatrix {
    return new PdfDomMatrix(this);
  }

  private copyFrom(init: MatrixInit): void {
    this.m11 = init.m11 ?? init.a ?? 1;
    this.m12 = init.m12 ?? init.b ?? 0;
    this.m13 = init.m13 ?? 0;
    this.m14 = init.m14 ?? 0;
    this.m21 = init.m21 ?? init.c ?? 0;
    this.m22 = init.m22 ?? init.d ?? 1;
    this.m23 = init.m23 ?? 0;
    this.m24 = init.m24 ?? 0;
    this.m31 = init.m31 ?? 0;
    this.m32 = init.m32 ?? 0;
    this.m33 = init.m33 ?? 1;
    this.m34 = init.m34 ?? 0;
    this.m41 = init.m41 ?? init.e ?? 0;
    this.m42 = init.m42 ?? init.f ?? 0;
    this.m43 = init.m43 ?? 0;
    this.m44 = init.m44 ?? 1;
  }

  private applySequence(values: number[]): void {
    if (values.length >= 16) {
      this.m11 = values[0]; this.m12 = values[1]; this.m13 = values[2]; this.m14 = values[3];
      this.m21 = values[4]; this.m22 = values[5]; this.m23 = values[6]; this.m24 = values[7];
      this.m31 = values[8]; this.m32 = values[9]; this.m33 = values[10]; this.m34 = values[11];
      this.m41 = values[12]; this.m42 = values[13]; this.m43 = values[14]; this.m44 = values[15];
      return;
    }
    if (values.length >= 6) {
      this.m11 = values[0]; this.m12 = values[1];
      this.m21 = values[2]; this.m22 = values[3];
      this.m41 = values[4]; this.m42 = values[5];
    }
  }

  private applyCss(css: string): void {
    const matrixMatch = /matrix\(\s*([^)]+)\)/i.exec(css);
    if (!matrixMatch) {
      return;
    }
    const values = matrixMatch[1]
      .split(/[, ]+/)
      .map((part) => Number(part.trim()))
      .filter((value) => Number.isFinite(value));
    this.applySequence(values);
  }
}

class PdfImageData {
  readonly data: Uint8ClampedArray;
  readonly width: number;
  readonly height: number;
  readonly colorSpace = 'srgb';

  constructor(dataOrWidth: Uint8ClampedArray | number, widthOrHeight?: number, maybeHeight?: number) {
    if (typeof dataOrWidth === 'number') {
      this.width = dataOrWidth;
      this.height = widthOrHeight ?? 0;
      this.data = new Uint8ClampedArray(this.width * this.height * 4);
      return;
    }
    this.data = dataOrWidth;
    this.width = widthOrHeight ?? 0;
    this.height = maybeHeight ?? 0;
  }
}

class PdfPath2D {
  constructor(_path?: PdfPath2D | string) {}

  addPath(_path: PdfPath2D): void {}

  closePath(): void {}

  moveTo(_x: number, _y: number): void {}

  lineTo(_x: number, _y: number): void {}

  bezierCurveTo(
    _cp1x: number,
    _cp1y: number,
    _cp2x: number,
    _cp2y: number,
    _x: number,
    _y: number,
  ): void {}

  quadraticCurveTo(_cpx: number, _cpy: number, _x: number, _y: number): void {}

  arc(
    _x: number,
    _y: number,
    _radius: number,
    _startAngle: number,
    _endAngle: number,
    _ccw?: boolean,
  ): void {}

  rect(_x: number, _y: number, _w: number, _h: number): void {}
}

function defineGlobal(name: string, value: unknown): void {
  Object.defineProperty(globalThis, name, {
    configurable: true,
    writable: true,
    value,
  });
}

/** pdf.js on Vercel/Node throws `DOMMatrix is not defined` without canvas. */
export function installPdfJsDomPolyfills(): void {
  if (typeof globalThis.DOMMatrix === 'undefined') {
    defineGlobal('DOMMatrix', PdfDomMatrix);
  }
  if (typeof globalThis.DOMMatrixReadOnly === 'undefined') {
    defineGlobal('DOMMatrixReadOnly', PdfDomMatrix);
  }
  if (typeof globalThis.ImageData === 'undefined') {
    defineGlobal('ImageData', PdfImageData);
  }
  if (typeof globalThis.Path2D === 'undefined') {
    defineGlobal('Path2D', PdfPath2D);
  }
}

export { PdfDomMatrix };
