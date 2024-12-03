import { fabric } from 'fabric';

// Register custom filter namespace if it doesn't exist
if (!fabric.Image.filters) {
  fabric.Image.filters = {};
}

// Custom Vignette Filter
fabric.Image.filters.Vignette = fabric.util.createClass(
  fabric.Image.filters.BaseFilter,
  {
    type: 'Vignette',
    fragmentSource: `
    precision highp float;
    uniform sampler2D uTexture;
    uniform float uRadius;
    varying vec2 vTexCoord;
    void main() {
      vec4 color = texture2D(uTexture, vTexCoord);
      float dist = distance(vTexCoord, vec2(0.5, 0.5));
      float vignette = smoothstep(0.8, uRadius * 0.799, dist * (1.0 + uRadius));
      gl_FragColor = vec4(color.rgb * vignette, color.a);
    }
  `,

    radius: 0.5,

    applyTo2d: function (options) {
      const ctx = options.ctx;
      const imageData = ctx.getImageData(
        0,
        0,
        options.sourceWidth,
        options.sourceHeight
      );
      const data = imageData.data;
      const w = options.sourceWidth;
      const h = options.sourceHeight;
      const centerX = w / 2;
      const centerY = h / 2;
      const radius = Math.sqrt(centerX * centerX + centerY * centerY);
      const maxDist = this.radius * radius;

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          const dx = x - centerX;
          const dy = y - centerY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const vignette = Math.max(0, 1 - dist / maxDist);

          data[idx] = data[idx] * vignette; // R
          data[idx + 1] = data[idx + 1] * vignette; // G
          data[idx + 2] = data[idx + 2] * vignette; // B
        }
      }

      ctx.putImageData(imageData, 0, 0);
    },

    getUniformLocations: function (gl, program) {
      return {
        uRadius: gl.getUniformLocation(program, 'uRadius'),
      };
    },

    sendUniformData: function (gl, uniformLocations) {
      gl.uniform1f(uniformLocations.uRadius, this.radius);
    },
  }
);

// Custom Dramatic Filter
fabric.Image.filters.Dramatic = fabric.util.createClass(
  fabric.Image.filters.BaseFilter,
  {
    type: 'Dramatic',
    fragmentSource: `
    precision highp float;
    uniform sampler2D uTexture;
    uniform float uIntensity;
    varying vec2 vTexCoord;
    void main() {
      vec4 color = texture2D(uTexture, vTexCoord);
      float r = color.r;
      float g = color.g;
      float b = color.b;
      
      // Increase contrast
      float contrast = 1.0 + uIntensity;
      r = (r - 0.5) * contrast + 0.5;
      g = (g - 0.5) * contrast + 0.5;
      b = (b - 0.5) * contrast + 0.5;
      
      // Add blue tint to shadows
      float luminance = (r + g + b) / 3.0;
      if (luminance < 0.5) {
        b = min(1.0, b + uIntensity * 0.2);
      }
      
      gl_FragColor = vec4(r, g, b, color.a);
    }
  `,

    intensity: 0.5,

    applyTo2d: function (options) {
      const ctx = options.ctx;
      const imageData = ctx.getImageData(
        0,
        0,
        options.sourceWidth,
        options.sourceHeight
      );
      const data = imageData.data;
      const intensity = this.intensity;

      for (let i = 0; i < data.length; i += 4) {
        // Increase contrast
        const factor = 1 + intensity;
        for (let j = 0; j < 3; j++) {
          data[i + j] = Math.min(
            255,
            Math.max(0, (data[i + j] - 128) * factor + 128)
          );
        }

        // Add blue tint to shadows
        const luminance = (data[i] + data[i + 1] + data[i + 2]) / 3;
        if (luminance < 128) {
          data[i + 2] = Math.min(255, data[i + 2] + intensity * 50);
        }
      }

      ctx.putImageData(imageData, 0, 0);
    },

    getUniformLocations: function (gl, program) {
      return {
        uIntensity: gl.getUniformLocation(program, 'uIntensity'),
      };
    },

    sendUniformData: function (gl, uniformLocations) {
      gl.uniform1f(uniformLocations.uIntensity, this.intensity);
    },
  }
);

// Custom Vintage Filter
fabric.Image.filters.Vintage = fabric.util.createClass(
  fabric.Image.filters.BaseFilter,
  {
    type: 'Vintage',
    fragmentSource: `
    precision highp float;
    uniform sampler2D uTexture;
    uniform float uIntensity;
    varying vec2 vTexCoord;
    void main() {
      vec4 color = texture2D(uTexture, vTexCoord);
      float r = color.r;
      float g = color.g;
      float b = color.b;
      
      // Sepia
      float rr = (r * 0.393 + g * 0.769 + b * 0.189) * (1.0 + uIntensity * 0.2);
      float gg = (r * 0.349 + g * 0.686 + b * 0.168) * (1.0 + uIntensity * 0.1);
      float bb = (r * 0.272 + g * 0.534 + b * 0.131);
      
      // Yellow tint
      if (uIntensity > 0.5) {
        rr = min(1.0, rr + uIntensity * 0.1);
        gg = min(1.0, gg + uIntensity * 0.05);
      }
      
      gl_FragColor = vec4(rr, gg, bb, color.a);
    }
  `,

    intensity: 0.5,

    applyTo2d: function (options) {
      const ctx = options.ctx;
      const imageData = ctx.getImageData(
        0,
        0,
        options.sourceWidth,
        options.sourceHeight
      );
      const data = imageData.data;
      const intensity = this.intensity;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Sepia effect
        data[i] = Math.min(
          255,
          (r * 0.393 + g * 0.769 + b * 0.189) * (1 + intensity * 0.2)
        );
        data[i + 1] = Math.min(
          255,
          (r * 0.349 + g * 0.686 + b * 0.168) * (1 + intensity * 0.1)
        );
        data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);

        // Yellow tint
        if (intensity > 0.5) {
          data[i] = Math.min(255, data[i] + intensity * 25);
          data[i + 1] = Math.min(255, data[i + 1] + intensity * 12);
        }
      }

      ctx.putImageData(imageData, 0, 0);
    },

    getUniformLocations: function (gl, program) {
      return {
        uIntensity: gl.getUniformLocation(program, 'uIntensity'),
      };
    },

    sendUniformData: function (gl, uniformLocations) {
      gl.uniform1f(uniformLocations.uIntensity, this.intensity);
    },
  }
);

// Custom Vibrant Filter
fabric.Image.filters.Vibrant = fabric.util.createClass(
  fabric.Image.filters.BaseFilter,
  {
    type: 'Vibrant',
    fragmentSource: `
    precision highp float;
    uniform sampler2D uTexture;
    uniform float uIntensity;
    varying vec2 vTexCoord;
    
    vec3 rgb2hsv(vec3 c) {
      vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
      vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
      vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
      float d = q.x - min(q.w, q.y);
      float e = 1.0e-10;
      return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
    }
    
    vec3 hsv2rgb(vec3 c) {
      vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
      vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
      return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }
    
    void main() {
      vec4 color = texture2D(uTexture, vTexCoord);
      vec3 hsv = rgb2hsv(color.rgb);
      hsv.y = min(1.0, hsv.y * (1.0 + uIntensity));
      gl_FragColor = vec4(hsv2rgb(hsv), color.a);
    }
  `,

    intensity: 0.5,

    applyTo2d: function (options) {
      const ctx = options.ctx;
      const imageData = ctx.getImageData(
        0,
        0,
        options.sourceWidth,
        options.sourceHeight
      );
      const data = imageData.data;
      const intensity = this.intensity;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const delta = (max - min) * intensity;

        if (r === max) data[i] = Math.min(255, r + delta);
        if (g === max) data[i + 1] = Math.min(255, g + delta);
        if (b === max) data[i + 2] = Math.min(255, b + delta);
      }

      ctx.putImageData(imageData, 0, 0);
    },

    getUniformLocations: function (gl, program) {
      return {
        uIntensity: gl.getUniformLocation(program, 'uIntensity'),
      };
    },

    sendUniformData: function (gl, uniformLocations) {
      gl.uniform1f(uniformLocations.uIntensity, this.intensity);
    },
  }
);

// Initialize all custom filters
export const initializeCustomFilters = () => {
  // Register WebGL shaders for each filter
  Object.values(fabric.Image.filters).forEach((filter: any) => {
    if (filter.prototype instanceof fabric.Image.filters.BaseFilter) {
      fabric.filterBackend?.initFilters([filter]);
    }
  });
};
