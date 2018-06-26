export type UUID = string;

export class RandomUtils {

  public static randomUUID(): UUID {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0; // tslint:disable-line
      const v = c === 'x' ? r : (r & 0x3 | 0x8); // tslint:disable-line
      const radix = 16;

      return v.toString(radix);
    });
  }
}