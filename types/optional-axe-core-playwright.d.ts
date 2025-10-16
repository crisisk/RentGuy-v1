declare module '@axe-core/playwright' {
  type Page = unknown;

  export interface AxeFinding {
    id: string;
    impact?: string;
    description?: string;
  }

  export default class AxeBuilder {
    constructor(options: { page: Page });
    analyze(): Promise<{
      violations?: AxeFinding[];
      passes?: AxeFinding[];
    }>;
  }
}
