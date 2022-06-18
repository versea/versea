/** 依赖注入类型的插件 */
export interface IPlugin {
  apply: () => void;
}
