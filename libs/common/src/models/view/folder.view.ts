import { Jsonify } from "type-fest";

import { EncryptService } from "../../abstractions/encrypt.service";
import { Encryptable, nullableFactory } from "../../interfaces/crypto.interface";
import { Folder } from "../domain/folder";
import { SymmetricCryptoKey } from "../domain/symmetric-crypto-key";
import { ITreeNodeObject } from "../domain/tree-node";

export class FolderView implements ITreeNodeObject, Encryptable<Folder> {
  id: string = null;
  name: string = null;
  revisionDate: Date = null;

  keyIdentifier(): string | null {
    return null; // Folders always belong to the user
  }

  async encrypt(encryptService: EncryptService, key: SymmetricCryptoKey): Promise<Folder> {
    const folder = new Folder();
    folder.id = this.id;
    folder.revisionDate = this.revisionDate;

    folder.name = this.name != null ? await encryptService.encrypt(this.name, key) : null;

    return folder;
  }

  static async decrypt(encryptService: EncryptService, key: SymmetricCryptoKey, model: Folder) {
    const view = new FolderView();
    view.id = model.id;
    view.revisionDate = model.revisionDate;

    view.name = await model.name?.decryptWithEncryptService(encryptService, key);

    return view;
  }

  static fromJSON(obj: Jsonify<FolderView>) {
    if (obj == null) {
      return null;
    }

    return Object.assign(new FolderView(), obj, {
      revisionDate: nullableFactory(Date, obj.revisionDate),
    });
  }
}
