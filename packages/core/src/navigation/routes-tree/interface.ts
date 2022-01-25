/* eslint-disable @typescript-eslint/no-explicit-any */
import { IApp } from '../../application/app/interface';
import { createServiceSymbol } from '../../utils';
import { RouteOptions } from '../route/service';

export const IRoutesTreeKey = createServiceSymbol('IRoutesTree');

export interface IRoutesTree {
  createTree: (options: RouteOptions[], app: IApp) => void;
}
