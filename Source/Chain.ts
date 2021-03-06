import * as FS from "fs";
import * as Path from "path";
import Block from './Block';
import * as OS from "os";


export default class Chain {

	public Name:string;
	public Chain = [];
	private CurrentBlock:Block;
	private __DBPath__:string;

	constructor (Name:string) {

		if (!Name) {

			throw new Error ("The chain must have a name.");
		}

		this.Name = Name;
		this.__DBPath__ = Path.join (OS.homedir (), `.chainDB/${this.Name}`);
		this.Chain = (FS.existsSync (Path.join (this.__DBPath__, "chainDB")) ? this.__GetFile__ ("chainDB", true) : []);

		this.__MakeChainPath__ ();
	}

	public NewBlock (Name:string, Content:any) {

		this.CurrentBlock = new Block (Name, Content, this.__PreviousBlockHash__ ());
		this.CurrentBlock.Encrypt ();


		this.Chain.push ({

			Name: this.CurrentBlock.Name,
			PreviousBlockHash: this.CurrentBlock.PreviousBlockHash,
			CurrentBlockHash: this.CurrentBlock.BlockHash
		});

		this.__MakeFile__ (this.CurrentBlock.BlockHash, JSON.stringify (this.CurrentBlock.Content), null);
		this.__MakeFile__ ("chainDB", JSON.stringify (this.Chain));
	}

	public GetBlock (BlockName:String, Return:String = "all") {

		const ReturnEspecification:any = ["all", "last", "first"];
		const Found = this.Chain.filter (Block => Block.Name === BlockName);

		if (Found.length === 0) {

			return null;
		}

		switch (Return) {

			case "first": return this.__DecryptBlock__ (Found[0]);
			case "last": return this.__DecryptBlock__ (Found[Found.length-1]);
			default: return Found.map (BlockFound => JSON.parse (this.__DecryptBlock__ (BlockFound)));
		}
	}

	public __DecryptBlock__ (BlockData:any) {

		if (!BlockData) {

			throw new Error ("A Block Must Be Given To Be Decrypted.");
		}

		const BlockDataContent = this.__GetFile__ (BlockData.CurrentBlockHash);

		const DecryptedBlock = new Block (BlockData.Name, BlockDataContent, BlockData.PreviousBlockHash);
		DecryptedBlock.BlockHash = BlockData.CurrentBlockHash;

		return DecryptedBlock.Decrypt ();
	}

	private __MakeChainPath__ ():void {

		try {

			FS.mkdirSync (this.__DBPath__);

		} catch (SomeError) {

			if (SomeError.code !== "EEXIST") {
			
				throw SomeError;
			}
		}
	}

	private __GetFile__ (FileName:string, Parse:boolean = false, Encode:any = "utf-8"):any {

		let File;

		try {

			File = FS.readFileSync (Path.join (this.__DBPath__, FileName), Encode);
		} catch (SomeError) {

			throw (SomeError);
		}

		if (File) {

			return (Parse ? JSON.parse (File) : File);
		}
	}

	private __MakeFile__ (FileName:any, Content:string, Encode:any = "utf-8"):any {

		try {

			FS.writeFileSync (Path.join (this.__DBPath__, FileName), Content, Encode);
		} catch (SomeError) {

			throw (SomeError);
		}
	}

	private __PreviousBlockHash__ ():any {

		return this.Chain.length > 0 ? this.Chain [this.Chain.length - 1].CurrentBlockHash : null;
	}
}