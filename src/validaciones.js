export const ValidacionesGlobales = {
  requerido: (v) => v && v.toString().trim() !== "" ? null : "Este campo es obligatorio.",
  longitudMinima: (min) => (v) => v && v.trim().length >= min ? null : `Debe contener mínimo ${min} caracteres.`,
  sinPalabrasProhibidas: (regexStr, msg) => (v) => {
    if (!v) return null;
    const rx = new RegExp(regexStr, 'i');
    return rx.test(v) ? msg : null;
  }
};