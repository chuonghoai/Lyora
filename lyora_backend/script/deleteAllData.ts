import {
  assertSafeEnvironment,
  createSeedDataSource,
} from '../seed/seed.config';

interface CountRow {
  count: string | number;
}

export async function runDeleteAllData(): Promise<void> {
  console.log(
    '================================================================',
  );
  console.log(
    '      LYORA DATABASE RESET RUNNER (Xóa toàn bộ dữ liệu)        ',
  );
  console.log(
    '================================================================',
  );
  const startTime = Date.now();

  // 1. Kiểm tra an toàn môi trường
  console.log('[1/4] Kiểm tra an toàn môi trường...');
  assertSafeEnvironment();
  console.log('      Môi trường an toàn: Được phép xóa dữ liệu.');

  // 2. Kết nối Database
  console.log('[2/4] Đang kết nối tới Database...');
  const dataSource = createSeedDataSource();
  await dataSource.initialize();
  console.log('      Kết nối Database thành công!');

  try {
    // 3. Lấy danh sách các bảng public (loại trừ migrations nếu có)
    console.log('[3/4] Kiểm tra dữ liệu hiện tại trước khi xóa...');
    const tablesResult = await dataSource.query<Array<{ table_name: string }>>(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name != 'migrations';
    `);

    const tableNames = tablesResult.map((t) => t.table_name);
    console.log(
      `      Phát hiện ${tableNames.length} bảng: ${tableNames.join(', ') || '(Không có bảng nào)'}`,
    );

    for (const tableName of tableNames) {
      const rows = await dataSource.query<CountRow[]>(
        `SELECT COUNT(*) as count FROM "${tableName}"`,
      );
      const count = rows[0]?.count ?? '0';
      console.log(
        `      - Bảng "${tableName}": ${count} bản ghi trước khi xóa.`,
      );
    }

    if (tableNames.length > 0) {
      console.log(
        '[XÓA] Đang thực thi TRUNCATE CASCADE trên tất cả các bảng...',
      );
      const quotedTableNames = tableNames.map((name) => `"${name}"`).join(', ');
      await dataSource.query(
        `TRUNCATE TABLE ${quotedTableNames} RESTART IDENTITY CASCADE;`,
      );
      console.log('      Đã thực thi TRUNCATE TABLE CASCADE thành công!');
    } else {
      console.log('      Không có bảng dữ liệu nào cần xóa.');
    }

    // 4. Xác minh sau khi xóa
    console.log('[4/4] Xác minh sau khi xóa...');
    let totalRemaining = 0;
    for (const tableName of tableNames) {
      const rows = await dataSource.query<CountRow[]>(
        `SELECT COUNT(*) as count FROM "${tableName}"`,
      );
      const count = rows[0]?.count ?? '0';
      const numCount =
        typeof count === 'number' ? count : parseInt(String(count), 10);
      totalRemaining += numCount;
      console.log(`      - Bảng "${tableName}": ${numCount} bản ghi còn lại.`);
      if (numCount > 0) {
        throw new Error(
          `Bảng "${tableName}" vẫn còn ${numCount} bản ghi sau khi TRUNCATE!`,
        );
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(
      '----------------------------------------------------------------',
    );
    console.log(` XÓA TOÀN BỘ DỮ LIỆU THÀNH CÔNG! (${duration}s)`);
    console.log(` Tổng số bảng đã làm sạch: ${tableNames.length}`);
    console.log(` Tổng số bản ghi còn lại: ${totalRemaining}`);
    console.log(
      '================================================================',
    );
  } catch (error) {
    console.error(' [LỖI] Quá trình xóa dữ liệu thất bại:', error);
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
  runDeleteAllData().catch(() => {
    process.exit(1);
  });
}
