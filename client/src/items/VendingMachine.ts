import { ItemType } from '../../../types/Items'
import Item from './Item'

export default class VendingMachine extends Item {
  itemDirection?: string
  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, frame?: string | number) {
    super(scene, x, y, texture, frame)

    this.itemType = ItemType.VENDINGMACHINE
  }

  onOverlapDialog() {
    const machineId = this.getData('id');
    if (machineId === 'vending_machine_0') {
      this.setDialogBox('Press Q to solve Quiz :)');
    }
  }
}
