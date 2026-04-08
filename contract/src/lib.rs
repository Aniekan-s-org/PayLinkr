#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype,
    token, Address, Env, String, Symbol,
};

// ─── Storage Keys ────────────────────────────────────────────────────────────

#[contracttype]
pub enum DataKey {
    Request(Symbol), // keyed by payment link ID
}

// ─── Data Types ───────────────────────────────────────────────────────────────

#[contracttype]
#[derive(Clone)]
pub struct PaymentRequest {
    pub creator: Address,   // who receives the payment
    pub token: Address,     // which token (e.g. USDC)
    pub amount: i128,       // amount in stroops / smallest unit
    pub description: String, // e.g. "Logo design"
    pub expiry: u64,        // Unix timestamp; 0 = no expiry
    pub paid: bool,
    pub payer: Option<Address>,
}

// ─── Contract ─────────────────────────────────────────────────────────────────

#[contract]
pub struct PayLinkr;

#[contractimpl]
impl PayLinkr {
    /// Create a new payment request.
    /// `id`          – unique link ID (e.g. Symbol::new(&env, "abc123"))
    /// `token`       – SAC address of the token to accept
    /// `amount`      – token amount (in base units)
    /// `description` – human-readable note
    /// `expiry`      – ledger timestamp after which the link is invalid (0 = never)
    pub fn create_request(
        env: Env,
        creator: Address,
        id: Symbol,
        token: Address,
        amount: i128,
        description: String,
        expiry: u64,
    ) {
        // creator must sign this call
        creator.require_auth();

        // prevent overwriting an existing request
        let key = DataKey::Request(id.clone());
        if env.storage().persistent().has(&key) {
            panic!("request already exists");
        }

        let request = PaymentRequest {
            creator,
            token,
            amount,
            description,
            expiry,
            paid: false,
            payer: None,
        };

        env.storage().persistent().set(&key, &request);
    }

    /// Pay an existing request.
    /// The payer must have approved this contract to spend `amount` of `token`.
    pub fn pay(env: Env, payer: Address, id: Symbol) {
        payer.require_auth();

        let key = DataKey::Request(id.clone());
        let mut request: PaymentRequest = env
            .storage()
            .persistent()
            .get(&key)
            .expect("request not found");

        assert!(!request.paid, "already paid");

        // check expiry
        if request.expiry > 0 {
            let now = env.ledger().timestamp();
            assert!(now <= request.expiry, "payment link expired");
        }

        // transfer tokens from payer → creator via the token contract
        let token_client = token::Client::new(&env, &request.token);
        token_client.transfer(&payer, &request.creator, &request.amount);

        // mark as paid
        request.paid = true;
        request.payer = Some(payer);
        env.storage().persistent().set(&key, &request);
    }

    /// Returns true if the request has been paid.
    pub fn is_paid(env: Env, id: Symbol) -> bool {
        let key = DataKey::Request(id);
        let request: Option<PaymentRequest> = env.storage().persistent().get(&key);
        match request {
            Some(r) => r.paid,
            None => false,
        }
    }

    /// Fetch the full request details.
    pub fn get_request(env: Env, id: Symbol) -> PaymentRequest {
        let key = DataKey::Request(id);
        env.storage()
            .persistent()
            .get(&key)
            .expect("request not found")
    }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{
        testutils::{Address as _, Ledger},
        token::{Client as TokenClient, StellarAssetClient},
        Env, String, Symbol,
    };

    fn setup() -> (Env, Address, Address, Address) {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let creator = Address::generate(&env);
        let payer = Address::generate(&env);

        (env, admin, creator, payer)
    }

    #[test]
    fn test_create_and_pay() {
        let (env, admin, creator, payer) = setup();

        // deploy a test token
        let token_id = env.register_stellar_asset_contract_v2(admin.clone());
        let token_address = token_id.address();
        let token_admin = StellarAssetClient::new(&env, &token_address);
        let token = TokenClient::new(&env, &token_address);

        // mint 100 tokens to payer
        token_admin.mint(&payer, &100);

        // deploy PayLinkr contract
        let contract_id = env.register(PayLinkr, ());
        let client = PayLinkrClient::new(&env, &contract_id);

        let id = Symbol::new(&env, "abc123");
        let desc = String::from_str(&env, "Logo design");

        // create request
        client.create_request(&creator, &id, &token_address, &10, &desc, &0);

        assert!(!client.is_paid(&id));

        // pay
        client.pay(&payer, &id);

        assert!(client.is_paid(&id));
        assert_eq!(token.balance(&creator), 10);
        assert_eq!(token.balance(&payer), 90);
    }

    #[test]
    #[should_panic(expected = "already paid")]
    fn test_double_pay_fails() {
        let (env, admin, creator, payer) = setup();

        let token_id = env.register_stellar_asset_contract_v2(admin.clone());
        let token_address = token_id.address();
        let token_admin = StellarAssetClient::new(&env, &token_address);
        token_admin.mint(&payer, &200);

        let contract_id = env.register(PayLinkr, ());
        let client = PayLinkrClient::new(&env, &contract_id);

        let id = Symbol::new(&env, "xyz");
        let desc = String::from_str(&env, "Test");

        client.create_request(&creator, &id, &token_address, &10, &desc, &0);
        client.pay(&payer, &id);
        client.pay(&payer, &id); // should panic
    }

    #[test]
    #[should_panic(expected = "payment link expired")]
    fn test_expired_link_fails() {
        let (env, admin, creator, payer) = setup();

        let token_id = env.register_stellar_asset_contract_v2(admin.clone());
        let token_address = token_id.address();
        let token_admin = StellarAssetClient::new(&env, &token_address);
        token_admin.mint(&payer, &100);

        let contract_id = env.register(PayLinkr, ());
        let client = PayLinkrClient::new(&env, &contract_id);

        let id = Symbol::new(&env, "exp1");
        let desc = String::from_str(&env, "Expired");

        // set expiry in the past
        env.ledger().with_mut(|l| l.timestamp = 1000);
        client.create_request(&creator, &id, &token_address, &10, &desc, &500);

        client.pay(&payer, &id); // should panic: expired
    }
}
