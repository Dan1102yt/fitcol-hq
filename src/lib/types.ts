export type Doc = { id: string; [k: string]: any };

export type Kpi = Doc & {
  area: string; nombre: string; como: string; meta_dic: string; meta_mar: string;
  north?: boolean; orden?: number; dec?: number; values?: { fecha: string; v: number }[];
};
export type RetoWeek = Doc & {
  semana: number; medicion: string; video: string;
  peso: number | null; grasa: number | null; musculo: number | null;
  cintura: number | null; kcal: number | null; proteina: number | null;
};
export type Contenido = Doc & {
  fecha: string; tipo: string; titulo: string; canal: string; estado: string;
  vistas: number | null; guardados: number | null;
};
export type Agente = Doc & {
  nombre: string; area: string; fase: string; estado: string; mision: string;
  entregables: string[]; prompt: string; orden?: number;
};
export type Tarea = Doc & { fase: string; titulo: string; fecha: string | null; responsable: string; hecho: boolean };
export type Comparacion = Doc & {
  fecha: string; comida: string;
  fitcol_kcal: number | null; fitia_kcal: number | null;
  fitcol_prot: number | null; fitia_prot: number | null;
  fitcol_seg: number | null; fitia_seg: number | null;
};
export type Empresa = {
  mision: string; tagline: string; dominio: string; bio: string;
  canales: { canal: string; usuario: string; uso: string; creado: boolean }[];
  correos: { correo: string; uso: string; creado: boolean }[];
  colores: { nombre: string; hex: string }[];
};
