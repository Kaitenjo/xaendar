export type Token = {
  type: 'INTERPOLATION' | 'DIRECTIVE' | 'TAG' | 'TEXT',
  value: string
}