/**
 * Mur + store vénitien + sol brillant, en un seul quad plein écran, dessinés
 * pour retrouver la cover : grande tache de lames épaisses (cœur orange vif,
 * bords cuivrés), interstices brun chaud, montant de fenêtre net à droite avec
 * une seconde fenêtre plus sombre au-delà, bleu nuit profond partout ailleurs,
 * flou de profondeur vers les bords, sol laqué qui reflète tout.
 *
 * `uMask` (rendu hors écran, ½ résolution) : canal R = ombres des silhouettes ;
 * elles retirent la lumière, avec un flou croissant en hauteur.
 */

export const wallVertex = /* glsl */ `
attribute vec2 aPosition;
varying vec2 vPos;
uniform mat3 uProjectionMatrix;
uniform mat3 uWorldTransformMatrix;
uniform mat3 uTransformMatrix;
void main() {
  mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
  gl_Position = vec4((mvp * vec3(aPosition, 1.0)).xy, 0.0, 1.0);
  vPos = aPosition;
}
`;

export const wallFragment = /* glsl */ `
precision highp float;
varying vec2 vPos;

uniform vec2 uRes;
uniform float uFloorY;
uniform vec2 uLight;
uniform vec3 uLight2;     // xy + intensité (0 = absente)
uniform vec2 uPatchHalf;
uniform float uSlope;
uniform float uPeriod;
uniform float uOpen;
uniform float uSoft;
uniform float uIntensity;
uniform float uTime;
uniform float uBlur;
uniform float uWarm;
uniform float uDisco;    // 0..1 : mode disco (boule à facettes)
uniform float uPulse;    // 1 sur le temps, décroît ensuite
uniform float uRush;     // 0..1 : précipitation (lumière froide, désaturée)
uniform vec3 uSpark;
uniform vec4 uRing;
uniform vec3 uWallTop;
uniform vec3 uWallBottom;
uniform vec3 uAmberA;
uniform vec3 uAmberB;
uniform vec3 uFloorCol;
uniform sampler2D uMask;

const float PI = 3.14159265;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// Lames : x = masque doux de la lame éclairée, y = profil (1 au cœur de la lame).
vec2 slats(float v, float period, float open, float soft) {
  float s = fract(v / period);
  float w = soft / period;
  float m = smoothstep(0.0, w, s) * (1.0 - smoothstep(open - w, open, s));
  float prof = s < open ? sin(PI * s / open) : 0.0;
  return vec2(m, prof);
}

/*
 * Une fenêtre vue sur le mur. Renvoie (lumière, cœur, enveloppe).
 * Bord droit net (le montant), bord gauche et haut/bas doux, flou de
 * profondeur qui grandit en s'éloignant du centre.
 */
vec3 window1(vec2 p, vec2 c, vec2 hf, float soft, float period, float hardRight) {
  vec2 q = p - c;
  float v = q.y - q.x * uSlope;
  float r = length(vec2(q.x / hf.x, max(0.0, -v) / hf.y));
  float sf = soft * (1.0 + 2.6 * r * r);
  float right = 1.0 - smoothstep(hf.x - hardRight, hf.x + hardRight, q.x);
  float left = smoothstep(-hf.x - 160.0, -hf.x + 120.0, q.x);
  // Seul le bord haut existe : la fenêtre descend jusqu'au sol (comme sur la cover).
  float ey = smoothstep(-hf.y - sf * 5.0, -hf.y + sf * 5.0, v);
  float env = right * left * ey * (1.0 - 0.35 * smoothstep(0.3, 1.3, r));
  vec2 s = slats(v, period, uOpen, sf);
  return vec3(env * s.x, env * s.y, env);
}

// Lumière totale du mur : x = lames éclairées, y = cœur, z = enveloppe (lumière diffuse).
vec3 lightAt(vec2 p) {
  vec3 a = window1(p, uLight, uPatchHalf, uSoft, uPeriod, 3.0);
  // Au-delà du montant : seconde fenêtre plus sombre, lames plus fines et plus floues.
  float w2 = uPatchHalf.x * 0.62;
  vec2 c2 = uLight + vec2(uPatchHalf.x + w2 + 14.0, (uPatchHalf.x + w2 + 14.0) * uSlope);
  vec3 b = window1(p, c2, vec2(w2, uPatchHalf.y * 1.05), uSoft * 2.2, uPeriod * 0.8, 3.0) * 0.36;
  // Montants verticaux (cadre) : fines barres sombres.
  float fx = p.x - (uLight.x + uPatchHalf.x);
  float frame = 1.0 - 0.9 * (1.0 - smoothstep(4.0, 10.0, abs(fx - 7.0))) - 0.7 * (1.0 - smoothstep(3.0, 8.0, abs(fx - w2 * 1.1)));
  vec3 l = (a + b) * frame * uIntensity;
  if (uLight2.z > 0.0) l += window1(p, uLight2.xy, uPatchHalf * 0.8, uSoft * 1.6, uPeriod * 0.9, 40.0) * uLight2.z;
  return l;
}

vec2 maskAt(vec2 p) {
  float h = clamp((uFloorY - p.y) / 750.0, 0.0, 1.0);
  vec2 uv = p / uRes;
  vec2 r = vec2(uBlur * (0.15 + h)) / uRes;
  vec4 m = texture2D(uMask, uv) * 0.2;
  m += texture2D(uMask, uv + r * vec2( 1.0,  0.0)) * 0.1;
  m += texture2D(uMask, uv + r * vec2(-1.0,  0.0)) * 0.1;
  m += texture2D(uMask, uv + r * vec2( 0.0,  1.0)) * 0.1;
  m += texture2D(uMask, uv + r * vec2( 0.0, -1.0)) * 0.1;
  m += texture2D(uMask, uv + r * vec2( 0.7,  0.7)) * 0.1;
  m += texture2D(uMask, uv + r * vec2(-0.7,  0.7)) * 0.1;
  m += texture2D(uMask, uv + r * vec2( 0.7, -0.7)) * 0.1;
  m += texture2D(uMask, uv + r * vec2(-0.7, -0.7)) * 0.1;
  return vec2(m.r, 0.0);
}

// Boule à facettes : taches colorées qui défilent (la boule tourne), flash sur le temps.
vec3 discoSpots(vec2 p) {
  vec3 acc = vec3(0.0);
  for (int k = 0; k < 2; k++) {
    float cell = k == 0 ? 175.0 : 120.0;
    vec2 q = p + vec2(uTime * (k == 0 ? 70.0 : -45.0), 0.0);
    vec2 id = floor(q / cell);
    vec2 f = fract(q / cell) - 0.5;
    float h = hash(id + float(k) * 17.0);
    vec2 o = vec2(hash(id + 3.1), hash(id + 7.7)) - 0.5;
    float r = mix(0.1, 0.2, h);
    float d = length(f - o * 0.5);
    float spot = 1.0 - smoothstep(r * 0.55, r, d);
    vec3 c = h < 0.25 ? vec3(1.0, 0.25, 0.65) : h < 0.5 ? vec3(0.25, 0.9, 1.0) : h < 0.75 ? vec3(1.0, 0.82, 0.3) : vec3(0.65, 0.4, 1.0);
    acc += c * spot * (0.6 + 0.4 * sin(uTime * 3.0 + h * 20.0));
  }
  return acc;
}

// Mur éclairé en p (sert aussi au reflet du sol).
vec3 wallAt(vec2 p) {
  float t = clamp(p.y / uFloorY, 0.0, 1.0);
  vec3 wall = mix(uWallTop, uWallBottom, t);
  // Lueur froide vers le haut droit, comme sur la cover.
  wall += vec3(0.0, 0.035, 0.085) * smoothstep(0.35, 1.0, p.x / uRes.x) * (1.0 - t * 0.6);
  wall = mix(wall, wall * vec3(1.2, 1.0, 0.9), uWarm * 0.5);

  vec2 m = maskAt(p);
  float sh = m.x;
  vec3 L = lightAt(p);
  float occl = 1.0 - sh * 0.94;
  // Interstices : brun chaud tant qu'on est dans la tache de lumière.
  vec3 gap = mix(wall, vec3(0.17, 0.07, 0.035), clamp(L.z * occl, 0.0, 1.0) * 0.7);
  gap *= 1.0 - 0.45 * sh;
  // Lame : cuivre sur les bords, orange vif au cœur.
  vec3 edge = uAmberA * vec3(0.8, 0.55, 0.36);
  vec3 core = mix(uAmberA, uAmberB, 0.6) * 1.18;
  vec3 slat = mix(edge, core, pow(clamp(L.y / max(L.z, 0.001), 0.0, 1.0), 0.6));
  vec3 col = mix(gap, slat, clamp(L.x * occl, 0.0, 1.0));
  // Halo : la lumière bave un peu dans l'air autour de la tache.
  col += uAmberA * 0.07 * L.z * occl;
  if (uDisco > 0.001) {
    // Le store s'efface au profit des taches de la boule ; la pièce vire au violet nuit.
    col = mix(col, col * 0.45 + vec3(0.04, 0.0, 0.08), uDisco * 0.7);
    col += discoSpots(p) * occl * uDisco * (0.75 + 0.6 * uPulse);
  }
  return col;
}

void main() {
  vec2 p = vPos;
  vec3 col;
  float grain = hash(floor(p * 0.85) + floor(uTime * 24.0)) - 0.5;

  if (p.y < uFloorY) {
    col = wallAt(p);
  } else {
    float d = p.y - uFloorY;
    // Sol laqué : reflet du mur, compressé par la perspective, légèrement ondulé.
    vec2 m = vec2(p.x + sin(p.y * 0.05 + uTime * 0.5) * 1.5, uFloorY - d * 1.55);
    col = uFloorCol * (0.75 + 0.25 * exp(-d / 500.0)) + wallAt(m) * 0.58 * exp(-d / 420.0);
    // Bandes de lumière posées au sol, dans le prolongement de la tache (reflet chaud diffus).
    float fx = 1.0 - smoothstep(uLight.x + uPatchHalf.x * 0.9, uLight.x + uPatchHalf.x * 1.1, p.x);
    col += uAmberA * 0.07 * fx * exp(-d / 260.0) * uIntensity;
    // Reflet spéculaire le long de la plinthe.
    col += vec3(0.25, 0.35, 0.55) * 0.08 * exp(-d / 18.0);
  }

  // Rayons dans l'air : on remonte vers la fenêtre (en haut à droite) et on cumule.
  vec2 dir = normalize(vec2(0.55, -0.83));
  float rays = 0.0;
  for (int i = 1; i <= 4; i++) {
    rays += lightAt(p + dir * (float(i) * 85.0 + 30.0)).x * (1.0 - float(i) * 0.15);
  }
  col += uAmberA * rays * 0.022;

  // Plinthe : fine ligne qui accroche la lumière.
  float base = exp(-abs(p.y - uFloorY) / 2.5);
  col += (vec3(0.08, 0.22, 0.5) * 0.3 + uAmberB * lightAt(vec2(p.x, uFloorY - 4.0)).x * 0.8) * base;

  // Étincelle quand les mains se frôlent + onde sur les temps réussis.
  float dsp = length(p - uSpark.xy);
  col += vec3(1.0, 0.8, 0.55) * (exp(-dsp / 30.0) * 1.1 + exp(-dsp / 130.0) * 0.25) * uSpark.z;
  float ring = exp(-pow((length(p - uRing.xy) - uRing.z) / 10.0, 2.0)) * uRing.w;
  col += uAmberB * ring * 0.6;

  // Rush : la chaleur s'en va, l'image se refroidit et se désature.
  float lum = dot(col, vec3(0.3, 0.55, 0.15));
  col = mix(col, vec3(lum) * vec3(0.45, 0.7, 1.25), uRush * 0.75);

  // Étalonnage : vignette, contraste doux, grain photo.
  vec2 vg = p / uRes - 0.5;
  col *= 1.0 - 0.75 * dot(vg * vec2(1.25, 0.85), vg * vec2(1.25, 0.85));
  col = col / (1.0 + col * 0.12);
  col = mix(col, col * col * (3.0 - 2.0 * col), 0.18);
  col += grain * (0.045 + 0.08 * uRush);
  gl_FragColor = vec4(col, 1.0);
}
`;
