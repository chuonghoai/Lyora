import { assertSafeEnvironment, createSeedDataSource } from './seed.config';
import { seedUsers } from './users.seed';

export async function runCreateSeedDB(): Promise<void> {
  console.log(
    '================================================================',
  );
  console.log(
    '       LYORA DATABASE SEED RUNNER (/lya-insertSeedDB)           ',
  );
  console.log(
    '================================================================',
  );
  const startTime = Date.now();

  // 1. Kiểm tra an toàn môi trường
  console.log('[1/4] Kiểm tra môi trường thực thi...');
  assertSafeEnvironment();
  console.log('      Môi trường an toàn: Được phép chạy seed data.');

  // 2. Kết nối Database
  console.log('[2/4] Đang kết nối tới Database...');
  const dataSource = createSeedDataSource();
  await dataSource.initialize();
  console.log('      Kết nối Database thành công!');

  try {
    // 3. Thực thi Seed từng entity
    console.log('[3/4] Bắt đầu khởi tạo dữ liệu mẫu...');
    const userResult = await seedUsers(dataSource);
    console.log(
      `      ✓ [${userResult.tableName}] ${userResult.entity}: Đã tạo thành công ${userResult.count} bản ghi.`,
    );

    // 4. Kiểm tra và đếm tổng số bản ghi trong các bảng thực tế
    console.log('[4/4] Kiểm tra và xác thực dữ liệu...');
    const userCount = await dataSource.getRepository(userResult.entity).count();
    console.log(
      `      - Bảng "${userResult.tableName}": ${userCount} bản ghi thực tế.`,
    );

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(
      '----------------------------------------------------------------',
    );
    console.log(` SEED DATABASE HOÀN TẤT THÀNH CÔNG (${duration}s)`);
    console.log(' Danh sách tài khoản thử nghiệm:');
    userResult.records.forEach((u) => {
      console.log(
        `   - [${u.role.padEnd(6)}] ${u.email.padEnd(22)} (${u.fullName}) - Active: ${u.isActive}`,
      );
    });
    console.log(
      '================================================================',
    );
  } catch (error) {
    console.error(' [LỖI] Quá trình seed dữ liệu thất bại:', error);
    process.exitCode = 1;
    throw error;
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('Đã đóng kết nối Database.');
    }
  }
}

// Tự động thực thi khi chạy trực tiếp qua CLI
if (require.main === module) {
  runCreateSeedDB().catch(() => {
    process.exit(1);
  });
}
