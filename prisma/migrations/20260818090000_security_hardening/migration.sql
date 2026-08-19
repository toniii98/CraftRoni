-- Invalidate outstanding reset links before enforcing one active token per user.
DELETE FROM `password_reset_tokens`;

-- Administrator access is migrated as an operational account. Existing customer
-- addresses are not grandfathered without proof; they can request a fresh
-- activation link through the neutral registration form.
ALTER TABLE `users`
    ADD COLUMN `emailVerifiedAt` DATETIME(3) NULL,
    ADD COLUMN `termsAcceptedAt` DATETIME(3) NULL,
    ADD COLUMN `termsVersion` VARCHAR(191) NULL;
UPDATE `users`
SET `emailVerifiedAt` = `createdAt`
WHERE `emailVerifiedAt` IS NULL AND `role` = 'ADMIN';
DELETE `sessions`
FROM `sessions`
INNER JOIN `users` ON `users`.`id` = `sessions`.`userId`
WHERE `users`.`role` = 'CUSTOMER';

-- AlterTable
ALTER TABLE `password_reset_tokens`
    ADD UNIQUE INDEX `password_reset_tokens_userId_key`(`userId`);
CREATE INDEX `password_reset_tokens_expiresAt_idx` ON `password_reset_tokens`(`expiresAt`);

CREATE INDEX `sessions_expiresAt_idx` ON `sessions`(`expiresAt`);

-- AlterTable
ALTER TABLE `products`
    ADD COLUMN `stockVersion` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `orders`
    ADD COLUMN `version` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `checkoutKeyHash` VARCHAR(191) NULL,
    ADD COLUMN `checkoutRequestHash` VARCHAR(191) NULL,
    ADD COLUMN `reservationExpiresAt` DATETIME(3) NULL,
    ADD COLUMN `stockReleasedAt` DATETIME(3) NULL,
    ADD COLUMN `paymentReviewRequired` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `paymentReviewReason` VARCHAR(191) NULL,
    ADD COLUMN `termsAcceptedAt` DATETIME(3) NULL,
    ADD COLUMN `termsVersion` VARCHAR(191) NULL;

-- Existing cancelled orders have already had their stock returned by the old code.
UPDATE `orders`
SET `stockReleasedAt` = `updatedAt`
WHERE `status` = 'CANCELLED' AND `stockReleasedAt` IS NULL;

CREATE UNIQUE INDEX `orders_checkoutKeyHash_key` ON `orders`(`checkoutKeyHash`);
CREATE INDEX `orders_status_reservationExpiresAt_idx`
    ON `orders`(`status`, `reservationExpiresAt`);

-- CreateTable
CREATE TABLE `autopay_transactions` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `serviceId` VARCHAR(10) NOT NULL,
    `remoteId` VARCHAR(20) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `currency` CHAR(3) NOT NULL,
    `status` ENUM('PENDING', 'SUCCESS', 'FAILURE') NOT NULL,
    `paymentDate` CHAR(14) NOT NULL,
    `paymentStatusDetails` VARCHAR(64) NULL,
    `firstSeenAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastSeenAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `autopay_transactions_serviceId_remoteId_key`(`serviceId`, `remoteId`),
    INDEX `autopay_transactions_orderId_status_idx`(`orderId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_review_cases` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `autopayTransactionId` VARCHAR(191) NULL,
    `kind` VARCHAR(191) NOT NULL,
    `dedupeKey` VARCHAR(191) NOT NULL,
    `remoteId` VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL,
    `reason` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `resolvedAt` DATETIME(3) NULL,
    `resolvedBy` VARCHAR(191) NULL,
    `resolution` VARCHAR(191) NULL,
    `reference` VARCHAR(191) NULL,

    UNIQUE INDEX `payment_review_cases_dedupeKey_key`(`dedupeKey`),
    INDEX `payment_review_cases_orderId_resolvedAt_idx`(`orderId`, `resolvedAt`),
    UNIQUE INDEX `payment_review_cases_autopayTransactionId_kind_key`(`autopayTransactionId`, `kind`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Existing pending orders predate expiring reservations. They are converted
-- into explicit reconciliation cases and are never released automatically.
UPDATE `orders`
SET `paymentReviewRequired` = true,
    `paymentReviewReason` = 'LEGACY_PENDING_REQUIRES_RECONCILIATION'
WHERE `status` = 'PENDING';

INSERT INTO `payment_review_cases`
    (`id`, `orderId`, `kind`, `dedupeKey`, `reason`, `createdAt`)
SELECT
    CONCAT('legacy_', REPLACE(UUID(), '-', '')),
    `id`,
    'LEGACY_RECONCILIATION',
    CONCAT('LEGACY:', `id`),
    'LEGACY_PENDING_REQUIRES_RECONCILIATION',
    CURRENT_TIMESTAMP(3)
FROM `orders`
WHERE `status` = 'PENDING';

-- A previously cancelled but paid order needs explicit proof of refund.
UPDATE `orders`
SET `paymentReviewRequired` = true,
    `paymentReviewReason` = 'PAID_ORDER_CANCELLED_REFUND_REQUIRED'
WHERE `status` = 'CANCELLED' AND `paidAt` IS NOT NULL;

INSERT INTO `payment_review_cases`
    (`id`, `orderId`, `kind`, `dedupeKey`, `remoteId`, `reason`, `createdAt`)
SELECT
    CONCAT('refund_', REPLACE(UUID(), '-', '')),
    `id`,
    'ORDER_CANCELLATION_REFUND',
    CONCAT('LEGACY_REFUND:', `id`),
    `paymentId`,
    'PAID_ORDER_CANCELLED_REFUND_REQUIRED',
    CURRENT_TIMESTAMP(3)
FROM `orders`
WHERE `status` = 'CANCELLED' AND `paidAt` IS NOT NULL;

-- CreateTable
CREATE TABLE `order_status_events` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `fromStatus` ENUM('PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED') NULL,
    `toStatus` ENUM('PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED') NOT NULL,
    `actorType` VARCHAR(191) NOT NULL,
    `actorId` VARCHAR(191) NULL,
    `reason` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `order_status_events_orderId_createdAt_idx`(`orderId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `email_verification_tokens` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `email_verification_tokens_token_key`(`token`),
    INDEX `email_verification_tokens_userId_expiresAt_idx`(`userId`, `expiresAt`),
    INDEX `email_verification_tokens_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `autopay_transactions`
    ADD CONSTRAINT `autopay_transactions_orderId_fkey`
    FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `payment_review_cases`
    ADD CONSTRAINT `payment_review_cases_orderId_fkey`
    FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `payment_review_cases`
    ADD CONSTRAINT `payment_review_cases_autopayTransactionId_fkey`
    FOREIGN KEY (`autopayTransactionId`) REFERENCES `autopay_transactions`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `order_status_events`
    ADD CONSTRAINT `order_status_events_orderId_fkey`
    FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `email_verification_tokens`
    ADD CONSTRAINT `email_verification_tokens_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;
