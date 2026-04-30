import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'currencySol',
})
export class CurrencySolPipe implements PipeTransform {
  transform(value: unknown, ...args: unknown[]): unknown {
    return null;
  }
}
