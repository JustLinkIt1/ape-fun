import os
from solana import SolanaClient, Account
from solana.rpc.api import Client
from solana.publickey import PublicKey
from solana.transaction import TransactionInstruction, AccountMeta
from solana.system_program import CreateAccountParams, TransferParams, transfer
import base64
import json
import requests

def create_meme_coin():
    # Initialize the client
    url = "https://api.mainnet-beta.solana.com"
    client = SolanaClient(url)
    
    # Create a new account and airdrop SOL to it
    new_account, resp = Account().create_account()
    print("New account created:", new_account.public_key())
    client.request_airdrop(new_account.public_key(), 1)
    
    # Wait for the transaction to be confirmed
    client.confirm_transaction(resp["result"])
    
    # Create a memecoin account and assign it to the new account
    meme_coin, resp = Account().create_account(
        from_pubkey=new_account.public_key(),
        lamports=1000000000000,
        space=12345,
        program_id="Memecoin program ID"
    )
    
    # Wait for the transaction to be confirmed
    client.confirm_transaction(resp["result"])
    
    print("Meme coin account created:", meme_coin)
    
    # Assign a memecoin balance of 10000 to the new account
    txn = TransactionInstruction(
        program_id="Memecoin program ID",
        data=base64.b64encode("Assign 1000 memes".encode()),
        keys=[
            AccountMeta(pubkey=new_account.public_key(), is_signer=True, is_writable=True),
            AccountMeta(pubkey=meme_coin, is_signer=False, is_writable=True)
        ]
    )
    
    # Sign and send the transaction
    client.send_transaction(txn, new_account)
    
    print("Meme coin balance assigned")
    
    # Transfer memes from one account to another
    txn = TransferParams(
        from_pubkey=new_account.public_key(),
        to_pubkey="Receiver's public key",
        lamports=10,
        amount=1000,
        program_id="Memecoin program ID"
    )
    
    client.transfer(txn)
    
    print("Meme coins transferred")