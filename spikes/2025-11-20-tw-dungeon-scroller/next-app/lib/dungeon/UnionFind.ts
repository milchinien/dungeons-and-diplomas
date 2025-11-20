export class UnionFind {
  parent: number[];

  constructor(size: number) {
    this.parent = new Array(size).fill(0).map((_, i) => i);
  }

  find(i: number): number {
    if (this.parent[i] === i) {
      return i;
    }
    this.parent[i] = this.find(this.parent[i]); // Path compression
    return this.parent[i];
  }

  union(i: number, j: number): boolean {
    const rootI = this.find(i);
    const rootJ = this.find(j);
    if (rootI !== rootJ) {
      this.parent[rootI] = rootJ;
      return true;
    }
    return false;
  }
}
