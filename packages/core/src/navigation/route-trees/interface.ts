/* eslint-disable @typescript-eslint/no-explicit-any */
import { IApp } from '../../application/app/interface';
import { createServiceSymbol } from '../../utils';
import { RouteOptions } from '../route/service';

export const IRouteTreesKey = createServiceSymbol('IRouteTrees');

export interface IRouteTrees {
  createTree: (options: RouteOptions[], app: IApp) => void;
}
