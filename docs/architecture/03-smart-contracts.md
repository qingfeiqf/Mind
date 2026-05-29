# 智能合约设计

## 一、合约架构总览

```
┌─────────────────────────────────────────────────────┐
│                    Mind Protocol                     │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │ IdeaRegistry │  │ IdeaToken    │  │ SparkMint │ │
│  │              │  │ (ERC-721 +   │  │           │ │
│  │ 想法确权注册  │  │  ERC-6551)   │  │ 积分铸造   │ │
│  └──────┬───────┘  └──────┬───────┘  └─────┬─────┘ │
│         │                 │                │        │
│  ┌──────┴─────────────────┴────────────────┴─────┐ │
│  │            MindController (UUPS Proxy)         │ │
│  │            权限控制 & 升级管理                    │ │
│  └───────────────────────────────────────────────┘ │
│                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │ Contribution │  │ Reputation   │  │ MindDAO   │ │
│  │ Token        │  │ SBT          │  │ Governor  │ │
│  │ (ERC-1155)   │  │ (ERC-5192)   │  │           │ │
│  │ 协作贡献代币  │  │ 声誉灵魂绑定  │  │ DAO 治理   │ │
│  └──────────────┘  └──────────────┘  └───────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## 二、核心合约设计

### 2.1 IdeaRegistry.sol - 想法确权注册

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title IdeaRegistry
 * @notice 想法确权注册合约 - 记录想法的链上哈希和元数据
 * @dev 使用 UUPS 代理模式支持升级
 */
contract IdeaRegistry is AccessControlUpgradeable, UUPSUpgradeable {
    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");
    
    struct IdeaRecord {
        address creator;           // 创作者地址
        bytes32 contentHash;       // 内容 SHA-256 哈希
        string ipfsCID;            // IPFS 内容标识符
        string arweaveId;          // Arweave 交易 ID (可选)
        uint256 registeredAt;      // 注册时间戳
        uint256 version;           // 版本号
        bytes32 parentHash;        // 父想法哈希 (用于衍生)
        bool exists;               // 记录是否存在
    }
    
    // 想法哈希 => 记录
    mapping(bytes32 => IdeaRecord) public ideas;
    
    // 创作者 => 想法哈希列表
    mapping(address => bytes32[]) public creatorIdeas;
    
    // 内容哈希 => 是否已注册 (防重复)
    mapping(bytes32 => bool) public contentRegistered;
    
    // 事件
    event IdeaRegistered(
        bytes32 indexed ideaHash,
        address indexed creator,
        bytes32 contentHash,
        string ipfsCID,
        uint256 registeredAt
    );
    
    event IdeaDerived(
        bytes32 indexed ideaHash,
        bytes32 indexed parentHash,
        address indexed creator
    );
    
    /// @notice 初始化函数 (代理模式)
    function initialize(address admin) public initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }
    
    /**
     * @notice 注册一个新想法
     * @param contentHash 内容的 SHA-256 哈希
     * @param ipfsCID IPFS 内容标识符
     * @param arweaveId Arweave 交易 ID (可选)
     */
    function registerIdea(
        bytes32 contentHash,
        string calldata ipfsCID,
        string calldata arweaveId
    ) external returns (bytes32 ideaHash) {
        require(!contentRegistered[contentHash], "Content already registered");
        
        // 生成唯一的想法哈希
        ideaHash = keccak256(abi.encodePacked(
            msg.sender, contentHash, block.timestamp
        ));
        
        ideas[ideaHash] = IdeaRecord({
            creator: msg.sender,
            contentHash: contentHash,
            ipfsCID: ipfsCID,
            arweaveId: arweaveId,
            registeredAt: block.timestamp,
            version: 1,
            parentHash: bytes32(0),
            exists: true
        });
        
        creatorIdeas[msg.sender].push(ideaHash);
        contentRegistered[contentHash] = true;
        
        emit IdeaRegistered(ideaHash, msg.sender, contentHash, ipfsCID, block.timestamp);
    }
    
    /**
     * @notice 注册一个衍生想法
     * @param contentHash 新内容哈希
     * @param parentHash 父想法哈希
     * @param ipfsCID IPFS CID
     */
    function registerDerivedIdea(
        bytes32 contentHash,
        bytes32 parentHash,
        string calldata ipfsCID
    ) external returns (bytes32 ideaHash) {
        require(ideas[parentHash].exists, "Parent idea not found");
        require(!contentRegistered[contentHash], "Content already registered");
        
        ideaHash = keccak256(abi.encodePacked(
            msg.sender, contentHash, block.timestamp
        ));
        
        ideas[ideaHash] = IdeaRecord({
            creator: msg.sender,
            contentHash: contentHash,
            ipfsCID: ipfsCID,
            arweaveId: "",
            registeredAt: block.timestamp,
            version: 1,
            parentHash: parentHash,
            exists: true
        });
        
        creatorIdeas[msg.sender].push(ideaHash);
        contentRegistered[contentHash] = true;
        
        emit IdeaDerived(ideaHash, parentHash, msg.sender);
    }
    
    /**
     * @notice 验证想法归属
     * @param ideaHash 想法哈希
     * @param creator 预期创作者
     * @return 是否为该创作者的想法
     */
    function verifyIdea(bytes32 ideaHash, address creator) external view returns (bool) {
        return ideas[ideaHash].creator == creator;
    }
    
    /**
     * @notice 获取创作者的所有想法
     * @param creator 创作者地址
     * @return 想法哈希数组
     */
    function getCreatorIdeas(address creator) external view returns (bytes32[] memory) {
        return creatorIdeas[creator];
    }
    
    /**
     * @notice 获取想法详情
     * @param ideaHash 想法哈希
     * @return record 想法记录
     */
    function getIdea(bytes32 ideaHash) external view returns (IdeaRecord memory record) {
        require(ideas[ideaHash].exists, "Idea not found");
        return ideas[ideaHash];
    }
    
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}
}
```

### 2.2 MIND_Token.sol - 平台治理代币

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PermitUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20VotesUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title MIND_Token
 * @notice Mind 平台治理代币，ERC-20 标准，支持投票和委托
 * @dev 固定供应量 10 亿枚，支持 EIP-2612 Permit
 */
contract MIND_Token is 
    ERC20Upgradeable, 
    ERC20PermitUpgradeable, 
    ERC20VotesUpgradeable,
    AccessControlUpgradeable, 
    UUPSUpgradeable 
{
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 1e18; // 10 亿
    
    function initialize(address admin, address minter) public initializer {
        __ERC20_init("Mind Token", "MIND");
        __ERC20Permit_init("Mind Token");
        __ERC20Votes_init();
        __AccessControl_init();
        __UUPSUpgradeable_init();
        
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, minter);
    }
    
    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(to, amount);
    }
    
    // Required overrides
    function _afterTokenTransfer(address from, address to, uint256 amount) internal override(ERC20Upgradeable, ERC20VotesUpgradeable) {
        super._afterTokenTransfer(from, to, amount);
    }
    
    function _mint(address to, uint256 amount) internal override(ERC20Upgradeable, ERC20VotesUpgradeable) {
        super._mint(to, amount);
    }
    
    function _burn(address account, uint256 amount) internal override(ERC20Upgradeable, ERC20VotesUpgradeable) {
        super._burn(account, amount);
    }
    
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}
}
```

### 2.3 SparkReward.sol - 积分奖励系统

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title SparkReward
 * @notice SPARK 积分系统 - 通过创作和互动获得积分
 * @dev 积分不可交易，仅用于平台内激励
 */
contract SparkReward is AccessControlUpgradeable, UUPSUpgradeable {
    bytes32 public constant REWARDER_ROLE = keccak256("REWARDER_ROLE");
    
    // 用户地址 => SPARK 积分余额
    mapping(address => uint256) public sparkBalance;
    
    // 用户地址 => 累计获得的 SPARK
    mapping(address => uint256) public totalEarned;
    
    // 积分类型
    enum SparkType {
        IDEA_PUBLISHED,     // 发布想法
        IDEA_LIKED,         // 想法被点赞
        COMMENT_QUALITY,    // 高质量评论
        COLLABORATION,      // 协作贡献
        GOVERNANCE_VOTE,    // 参与治理投票
        DAILY_LOGIN,        // 每日登录
        REFERRAL            // 邀请新用户
    }
    
    // 积分类型 => 奖励数量
    mapping(SparkType => uint256) public rewardAmounts;
    
    event SparkEarned(address indexed user, SparkType sparkType, uint256 amount, uint256 totalBalance);
    event SparkSpent(address indexed user, uint256 amount, uint256 remainingBalance);
    
    function initialize(address admin) public initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        
        // 默认奖励数量
        rewardAmounts[SparkType.IDEA_PUBLISHED] = 100 * 1e18;
        rewardAmounts[SparkType.IDEA_LIKED] = 10 * 1e18;
        rewardAmounts[SparkType.COMMENT_QUALITY] = 20 * 1e18;
        rewardAmounts[SparkType.COLLABORATION] = 50 * 1e18;
        rewardAmounts[SparkType.GOVERNANCE_VOTE] = 5 * 1e18;
        rewardAmounts[SparkType.DAILY_LOGIN] = 1 * 1e18;
        rewardAmounts[SparkType.REFERRAL] = 200 * 1e18;
    }
    
    function rewardSpark(address user, SparkType sparkType) external onlyRole(REWARDER_ROLE) {
        uint256 amount = rewardAmounts[sparkType];
        require(amount > 0, "Invalid spark type");
        
        sparkBalance[user] += amount;
        totalEarned[user] += amount;
        
        emit SparkEarned(user, sparkType, amount, sparkBalance[user]);
    }
    
    function spendSpark(uint256 amount) external {
        require(sparkBalance[msg.sender] >= amount, "Insufficient spark");
        sparkBalance[msg.sender] -= amount;
        emit SparkSpent(msg.sender, amount, sparkBalance[msg.sender]);
    }
    
    function getSparkBalance(address user) external view returns (uint256) {
        return sparkBalance[user];
    }
    
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}
}
```

---

## 三、开发环境配置

### 3.1 Hardhat 配置

```typescript
// contracts/hardhat.config.ts
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import "dotenv/config";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      evmVersion: "cancun"
    }
  },
  networks: {
    hardhat: {},
    arbitrumSepolia: {
      url: process.env.ARBITRUM_SEPOLIA_RPC || "https://sepolia-rollup.arbitrum.io/rpc",
      accounts: process.env.DEPLOYER_KEY ? [process.env.DEPLOYER_KEY] : [],
      chainId: 421614
    },
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC || "https://sepolia.base.org",
      accounts: process.env.DEPLOYER_KEY ? [process.env.DEPLOYER_KEY] : [],
      chainId: 84532
    }
  },
  etherscan: {
    apiKey: {
      arbitrumSepolia: process.env.ARBISCAN_API_KEY || "",
      baseSepolia: process.env.BASESCAN_API_KEY || ""
    }
  }
};

export default config;
```

---

## 四、测试策略

### 4.1 测试覆盖要求

| 合约 | 单位测试 | 集成测试 | 模糊测试 | 形式验证 |
|------|----------|----------|----------|----------|
| IdeaRegistry | 100% | 100% | 关键函数 | - |
| MIND_Token | 100% | 100% | 铸造/转账 | 关键不变量 |
| SparkReward | 100% | 100% | - | - |

### 4.2 关键测试场景

- 想法重复注册防护
- 衍生想法链路完整性
- 积分奖励正确性
- 代币供应量上限
- 升级代理安全性
- 权限控制正确性
