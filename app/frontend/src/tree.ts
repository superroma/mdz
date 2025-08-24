export type TreeNode = { path: string; title: string; children?: TreeNode[] }

export function flattenTreePreOrder(nodes: TreeNode[]): string[] {
  const out: string[] = []
  const walk = (arr: TreeNode[]) => {
    for (const n of arr) {
      out.push(n.path)
      if (n.children && n.children.length > 0) walk(n.children)
    }
  }
  walk(nodes)
  return out
}
