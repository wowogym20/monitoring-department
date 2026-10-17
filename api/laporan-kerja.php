<?php
/**
 * REST API Endpoint: Laporan Kerja (PHP Native)
 * Projek: Tazakka Absensi & Laporan Kerja
 * Konsumen: Aplikasi Eksternal (Next.js Monitoring Departemen)
 * Fitur: Full CRUD (GET, POST [Create], PUT/POST [Update], PATCH/POST [Status], DELETE/POST [Delete])
 */

// 1. Header CORS & Tipe Konten
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Api-Key');
header('Content-Type: application/json; charset=UTF-8');

// Tangani HTTP Preflight Request (OPTIONS)
if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 2. Konfigurasi Token Rahasia (API Key)
if (!defined('TAZAKKA_API_KEY')) {
    $env_key = getenv('TAZAKKA_API_KEY');
    define('TAZAKKA_API_KEY', !empty($env_key) ? $env_key : 'tazakka_secret_key_2026');
}

// 3. Validasi Autentikasi (Header X-Api-Key atau fallback query param api_key)
$client_api_key = null;

if (!empty($_SERVER['HTTP_X_API_KEY'])) {
    $client_api_key = trim($_SERVER['HTTP_X_API_KEY']);
} elseif (function_exists('getallheaders')) {
    $headers = getallheaders();
    if (is_array($headers)) {
        foreach ($headers as $key => $value) {
            if (strcasecmp($key, 'X-Api-Key') === 0) {
                $client_api_key = trim($value);
                break;
            }
        }
    }
}

if (empty($client_api_key) && !empty($_GET['api_key'])) {
    $client_api_key = trim($_GET['api_key']);
}

if (empty($client_api_key) || !hash_equals(TAZAKKA_API_KEY, $client_api_key)) {
    http_response_code(401);
    echo json_encode([
        'status' => 'error',
        'message' => 'Unauthorized: API Key tidak valid'
    ], JSON_UNESCAPED_SLASHES);
    exit;
}

// 4. Load File Konfigurasi Bawaan & Koneksi Database Tazakka
try {
    require_once __DIR__ . '/../sw-library/sw-config.php';
    require_once __DIR__ . '/../sw-library/sw-function.php';
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Internal Server Error: Gagal memuat konfigurasi sistem'
    ], JSON_UNESCAPED_SLASHES);
    exit;
}

// Pastikan Koneksi Database Siap
if (!isset($connection) || !($connection instanceof mysqli) || $connection->connect_error) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Internal Server Error: Gagal terhubung ke database'
    ], JSON_UNESCAPED_SLASHES);
    exit;
}

// 5. Tentukan Base URL & Direktori Upload
$base_domain = '';
if (!empty($site_url)) {
    $base_domain = rtrim($site_url, '/');
} elseif (function_exists('base_url')) {
    $base_domain = rtrim(base_url(), '/');
} else {
    $scheme = (!empty($_SERVER['HTTPS']) && strtolower($_SERVER['HTTPS']) !== 'off') ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $base_domain = $scheme . '://' . $host;
}

$upload_dir = __DIR__ . '/../sw-content/laporan-kerja/';
if (!is_dir($upload_dir)) {
    @mkdir($upload_dir, 0755, true);
}

// Helper: Deteksi metode HTTP riil (mendukung _method override & query action)
$request_method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
$action_param   = strtolower($_GET['action'] ?? $_POST['action'] ?? '');
$method_override = strtoupper($_POST['_method'] ?? $_GET['_method'] ?? '');
if (!empty($method_override)) {
    $request_method = $method_override;
}

// Helper: Membaca input JSON jika dikirim via Content-Type: application/json
$raw_input = file_get_contents('php://input');
$json_input = [];
if (!empty($raw_input)) {
    $parsed = json_decode($raw_input, true);
    if (is_array($parsed)) {
        $json_input = $parsed;
    }
}

// Helper: Ambil nilai parameter dari POST / JSON / GET
function get_param($key, $default = '') {
    global $json_input;
    if (isset($_POST[$key])) return is_string($_POST[$key]) ? trim($_POST[$key]) : $_POST[$key];
    if (isset($json_input[$key])) return is_string($json_input[$key]) ? trim($json_input[$key]) : $json_input[$key];
    if (isset($_GET[$key])) return is_string($_GET[$key]) ? trim($_GET[$key]) : $_GET[$key];
    return $default;
}

// =========================================================================
// ROUTING AKSI CRUD
// =========================================================================

// -------------------------------------------------------------------------
// A. READ / LIST (GET)
// -------------------------------------------------------------------------
if ($request_method === 'GET' && empty($action_param)) {
    $where_clauses = [];
    $params_types  = '';
    $params_values = [];

    // Filter: nip
    $nip = get_param('nip');
    if (!empty($nip)) {
        $where_clauses[] = 'u.nip = ?';
        $params_types   .= 's';
        $params_values[] = $nip;
    }

    // Filter: rentang tanggal
    $tanggal_mulai   = get_param('tanggal_mulai');
    $tanggal_selesai = get_param('tanggal_selesai');

    if ($tanggal_mulai !== '' && $tanggal_selesai !== '') {
        $where_clauses[] = 'uk.tanggal BETWEEN ? AND ?';
        $params_types   .= 'ss';
        $params_values[] = $tanggal_mulai;
        $params_values[] = $tanggal_selesai;
    } elseif ($tanggal_mulai !== '') {
        $where_clauses[] = 'uk.tanggal >= ?';
        $params_types   .= 's';
        $params_values[] = $tanggal_mulai;
    } elseif ($tanggal_selesai !== '') {
        $where_clauses[] = 'uk.tanggal <= ?';
        $params_types   .= 's';
        $params_values[] = $tanggal_selesai;
    }

    // Filter: bulan & tahun
    $bulan = get_param('bulan');
    if ($bulan !== '') {
        $b = (int)$bulan;
        if ($b >= 1 && $b <= 12) {
            $where_clauses[] = 'MONTH(uk.tanggal) = ?';
            $params_types   .= 'i';
            $params_values[] = $b;
        }
    }

    $tahun = get_param('tahun');
    if ($tahun !== '') {
        $t = (int)$tahun;
        if ($t >= 1970 && $t <= 2100) {
            $where_clauses[] = 'YEAR(uk.tanggal) = ?';
            $params_types   .= 'i';
            $params_values[] = $t;
        }
    }

    // Filter: status ('PENDING', 'Y', 'N')
    $status_input = strtoupper(get_param('status'));
    if (!empty($status_input) && in_array($status_input, ['PENDING', 'Y', 'N'], true)) {
        $where_clauses[] = 'uk.status = ?';
        $params_types   .= 's';
        $params_values[] = $status_input;
    }

    $where_sql = !empty($where_clauses) ? ' WHERE ' . implode(' AND ', $where_clauses) : '';

    // Paginasi
    $limit = (int)get_param('limit', 50);
    if ($limit <= 0) $limit = 50;
    if ($limit > 200) $limit = 200;

    $page = (int)get_param('page', 1);
    if ($page <= 0) $page = 1;
    $offset = ($page - 1) * $limit;

    // Hitung Total Data
    $count_sql = "SELECT COUNT(*) AS total_rows 
                  FROM uraian_kerja uk 
                  LEFT JOIN user u ON uk.user_id = u.user_id" . $where_sql;

    $stmt_count = $connection->prepare($count_sql);
    if (!$stmt_count) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Database Query Error: ' . $connection->error], JSON_UNESCAPED_SLASHES);
        exit;
    }

    if (!empty($params_values)) {
        $stmt_count->bind_param($params_types, ...$params_values);
    }

    $stmt_count->execute();
    $result_count = $stmt_count->get_result();
    $row_count    = $result_count ? $result_count->fetch_assoc() : ['total_rows' => 0];
    $total_rows   = (int)($row_count['total_rows'] ?? 0);
    $stmt_count->close();

    $total_pages = $limit > 0 ? (int)ceil($total_rows / $limit) : 0;

    // Ambil Data Laporan Kerja
    $data_sql = "SELECT 
                    uk.uraian_kerja_id AS id,
                    COALESCE(u.nip, '') AS nip,
                    COALESCE(u.nama_lengkap, '-') AS nama_pegawai,
                    COALESCE(uk.nama, '-') AS judul,
                    uk.tanggal,
                    uk.time AS jam,
                    COALESCE(uk.keterangan, '') AS keterangan,
                    uk.files AS foto_file,
                    uk.status
                 FROM uraian_kerja uk
                 LEFT JOIN user u ON uk.user_id = u.user_id
                 {$where_sql}
                 ORDER BY uk.tanggal DESC, uk.time DESC, uk.uraian_kerja_id DESC
                 LIMIT ? OFFSET ?";

    $stmt_data = $connection->prepare($data_sql);
    if (!$stmt_data) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Database Query Error: ' . $connection->error], JSON_UNESCAPED_SLASHES);
        exit;
    }

    $data_params_types  = $params_types . 'ii';
    $data_params_values = array_merge($params_values, [$limit, $offset]);

    $stmt_data->bind_param($data_params_types, ...$data_params_values);
    $stmt_data->execute();
    $result_data = $stmt_data->get_result();

    $items = [];
    while ($row = $result_data->fetch_assoc()) {
        $raw_status = $row['status'] ?? 'PENDING';
        $status_label = 'Pending';
        if ($raw_status === 'Y') {
            $status_label = 'Disetujui';
        } elseif ($raw_status === 'N') {
            $status_label = 'Ditolak';
        }

        $foto_name = !empty($row['foto_file']) ? trim($row['foto_file']) : null;
        $foto_url  = null;
        if (!empty($foto_name)) {
            $foto_url = $base_domain . '/sw-content/laporan-kerja/' . $foto_name;
        }

        $items[] = [
            'id'           => (int)$row['id'],
            'nip'          => (string)$row['nip'],
            'nama_pegawai' => (string)$row['nama_pegawai'],
            'judul'        => (string)$row['judul'],
            'tanggal'      => (string)$row['tanggal'],
            'jam'          => (string)$row['jam'],
            'keterangan'   => (string)$row['keterangan'],
            'foto_file'    => $foto_name,
            'foto_url'     => $foto_url,
            'status'       => (string)$raw_status,
            'status_label' => $status_label
        ];
    }
    $stmt_data->close();

    http_response_code(200);
    echo json_encode([
        'status'      => 'success',
        'total'       => $total_rows,
        'page'        => $page,
        'limit'       => $limit,
        'total_pages' => $total_pages,
        'data'        => $items
    ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

// -------------------------------------------------------------------------
// B. CREATE / TAMBAH LAPORAN KERJA (POST)
// -------------------------------------------------------------------------
if (($request_method === 'POST' && (empty($action_param) || $action_param === 'add')) && empty($method_override)) {
    $nip        = get_param('nip');
    $nama       = get_param('nama'); // Judul Laporan
    $tanggal    = get_param('tanggal');
    $keterangan = get_param('keterangan');

    if (empty($nip)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'NIP pegawai wajib diisi'], JSON_UNESCAPED_SLASHES);
        exit;
    }
    if (empty($nama)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Judul laporan kerja wajib diisi'], JSON_UNESCAPED_SLASHES);
        exit;
    }
    if (empty($tanggal)) {
        $tanggal = date('Y-m-d');
    }

    // Cari user_id dan lokasi_id berdasarkan NIP
    $user_id = 0;
    $lokasi_id = 1;
    $stmt_user = $connection->prepare("SELECT user_id, lokasi_id FROM user WHERE nip = ? LIMIT 1");
    if ($stmt_user) {
        $stmt_user->bind_param('s', $nip);
        $stmt_user->execute();
        $res_user = $stmt_user->get_result();
        if ($u = $res_user->fetch_assoc()) {
            $user_id   = (int)$u['user_id'];
            $lokasi_id = !empty($u['lokasi_id']) ? (int)$u['lokasi_id'] : 1;
        }
        $stmt_user->close();
    }

    if ($user_id === 0) {
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => "Pegawai dengan NIP '{$nip}' tidak ditemukan di sistem database Tazakka"], JSON_UNESCAPED_SLASHES);
        exit;
    }

    // Proses unggah foto dokumentasi
    $new_file_name = null;
    $allowed_ext = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

    // 1. Cek unggahan file via Multipart FormData
    if (!empty($_FILES['files']['name']) && $_FILES['files']['error'] === UPLOAD_ERR_OK) {
        $file_tmp  = $_FILES['files']['tmp_name'];
        $file_name = $_FILES['files']['name'];
        $file_size = $_FILES['files']['size'];
        $ext       = strtolower(pathinfo($file_name, PATHINFO_EXTENSION));

        if (!in_array($ext, $allowed_ext, true)) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Format file foto harus berupa JPG, PNG, GIF, atau WEBP'], JSON_UNESCAPED_SLASHES);
            exit;
        }
        if ($file_size > 5 * 1024 * 1024) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Ukuran file foto maksimal 5MB'], JSON_UNESCAPED_SLASHES);
            exit;
        }

        $new_file_name = uniqid((string)$user_id, true) . '.' . $ext;
        if (!move_uploaded_file($file_tmp, $upload_dir . $new_file_name)) {
            $new_file_name = null;
        }
    }
    // 2. Cek unggahan base64 jika dikirim via JSON
    elseif (!empty($json_input['foto_base64'])) {
        $base64_str = $json_input['foto_base64'];
        if (preg_match('/^data:image\/(\w+);base64,/', $base64_str, $matches)) {
            $ext = strtolower($matches[1]);
            if ($ext === 'jpeg') $ext = 'jpg';
            if (in_array($ext, $allowed_ext, true)) {
                $raw_data = base64_decode(substr($base64_str, strpos($base64_str, ',') + 1));
                if ($raw_data !== false) {
                    $new_file_name = uniqid((string)$user_id, true) . '.' . $ext;
                    file_put_contents($upload_dir . $new_file_name, $raw_data);
                }
            }
        }
    }

    // Insert ke tabel uraian_kerja
    $cur_date = date('Y-m-d');
    $cur_time = date('H:i:s');
    $status_default = 'PENDING';

    $insert_sql = "INSERT INTO uraian_kerja (user_id, lokasi_id, nama, tanggal, keterangan, files, date, time, status) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
    $stmt_ins = $connection->prepare($insert_sql);
    if (!$stmt_ins) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Query Prepare Error: ' . $connection->error], JSON_UNESCAPED_SLASHES);
        exit;
    }

    $stmt_ins->bind_param('iisssssss', $user_id, $lokasi_id, $nama, $tanggal, $keterangan, $new_file_name, $cur_date, $cur_time, $status_default);
    if ($stmt_ins->execute()) {
        $insert_id = $stmt_ins->insert_id;
        $stmt_ins->close();

        http_response_code(201);
        echo json_encode([
            'status'  => 'success',
            'message' => 'Laporan kerja berhasil dibuat',
            'id'      => $insert_id
        ], JSON_UNESCAPED_SLASHES);
        exit;
    } else {
        $err = $stmt_ins->error;
        $stmt_ins->close();
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Gagal menyimpan laporan kerja: ' . $err], JSON_UNESCAPED_SLASHES);
        exit;
    }
}

// -------------------------------------------------------------------------
// C. UPDATE / EDIT LAPORAN KERJA (PUT atau POST action=update)
// -------------------------------------------------------------------------
if ($request_method === 'PUT' || ($request_method === 'POST' && $action_param === 'update')) {
    $id         = (int)get_param('id');
    $nama       = get_param('nama');
    $tanggal    = get_param('tanggal');
    $keterangan = get_param('keterangan');

    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Parameter ID laporan kerja tidak valid'], JSON_UNESCAPED_SLASHES);
        exit;
    }

    // Ambil data lama
    $old_files = null;
    $stmt_check = $connection->prepare("SELECT files FROM uraian_kerja WHERE uraian_kerja_id = ? LIMIT 1");
    if ($stmt_check) {
        $stmt_check->bind_param('i', $id);
        $stmt_check->execute();
        $res_check = $stmt_check->get_result();
        if ($r = $res_check->fetch_assoc()) {
            $old_files = $r['files'];
        }
        $stmt_check->close();
    }

    // Cek jika ada foto baru yang diunggah
    $new_file_name = null;
    $allowed_ext = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    if (!empty($_FILES['files']['name']) && $_FILES['files']['error'] === UPLOAD_ERR_OK) {
        $file_tmp  = $_FILES['files']['tmp_name'];
        $file_name = $_FILES['files']['name'];
        $ext       = strtolower(pathinfo($file_name, PATHINFO_EXTENSION));

        if (in_array($ext, $allowed_ext, true)) {
            $new_file_name = uniqid('edit_' . $id . '_', true) . '.' . $ext;
            if (move_uploaded_file($file_tmp, $upload_dir . $new_file_name)) {
                // Hapus foto lama jika ada
                if (!empty($old_files) && file_exists($upload_dir . $old_files)) {
                    @unlink($upload_dir . $old_files);
                }
            } else {
                $new_file_name = null;
            }
        }
    }

    if (!empty($new_file_name)) {
        $update_sql = "UPDATE uraian_kerja SET nama = ?, tanggal = ?, keterangan = ?, files = ? WHERE uraian_kerja_id = ?";
        $stmt_upd = $connection->prepare($update_sql);
        $stmt_upd->bind_param('ssssi', $nama, $tanggal, $keterangan, $new_file_name, $id);
    } else {
        $update_sql = "UPDATE uraian_kerja SET nama = ?, tanggal = ?, keterangan = ? WHERE uraian_kerja_id = ?";
        $stmt_upd = $connection->prepare($update_sql);
        $stmt_upd->bind_param('sssi', $nama, $tanggal, $keterangan, $id);
    }

    if ($stmt_upd && $stmt_upd->execute()) {
        $stmt_upd->close();
        http_response_code(200);
        echo json_encode(['status' => 'success', 'message' => 'Laporan kerja berhasil diperbarui'], JSON_UNESCAPED_SLASHES);
        exit;
    } else {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Gagal memperbarui data: ' . $connection->error], JSON_UNESCAPED_SLASHES);
        exit;
    }
}

// -------------------------------------------------------------------------
// D. APPROVAL / UBAH STATUS (PATCH atau POST action=status)
// -------------------------------------------------------------------------
if ($request_method === 'PATCH' || ($request_method === 'POST' && $action_param === 'status')) {
    $id     = (int)get_param('id');
    $status = strtoupper(get_param('status'));

    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Parameter ID laporan tidak valid'], JSON_UNESCAPED_SLASHES);
        exit;
    }

    if (!in_array($status, ['Y', 'N', 'PENDING'], true)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => "Nilai status tidak valid. Gunakan 'Y', 'N', atau 'PENDING'"], JSON_UNESCAPED_SLASHES);
        exit;
    }

    $stmt_status = $connection->prepare("UPDATE uraian_kerja SET status = ? WHERE uraian_kerja_id = ?");
    if ($stmt_status) {
        $stmt_status->bind_param('si', $status, $id);
        if ($stmt_status->execute()) {
            $stmt_status->close();
            http_response_code(200);
            echo json_encode([
                'status'       => 'success',
                'message'      => 'Status laporan kerja berhasil diperbarui',
                'new_status'   => $status,
                'status_label' => ($status === 'Y' ? 'Disetujui' : ($status === 'N' ? 'Ditolak' : 'Pending'))
            ], JSON_UNESCAPED_SLASHES);
            exit;
        }
        $stmt_status->close();
    }

    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Gagal memperbarui status: ' . $connection->error], JSON_UNESCAPED_SLASHES);
    exit;
}

// -------------------------------------------------------------------------
// E. DELETE / HAPUS LAPORAN KERJA (DELETE atau POST action=delete)
// -------------------------------------------------------------------------
if ($request_method === 'DELETE' || ($request_method === 'POST' && $action_param === 'delete')) {
    $id = (int)get_param('id');

    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Parameter ID laporan tidak valid'], JSON_UNESCAPED_SLASHES);
        exit;
    }

    // Ambil nama file foto untuk dibersihkan dari server
    $file_to_delete = null;
    $stmt_f = $connection->prepare("SELECT files FROM uraian_kerja WHERE uraian_kerja_id = ? LIMIT 1");
    if ($stmt_f) {
        $stmt_f->bind_param('i', $id);
        $stmt_f->execute();
        $res_f = $stmt_f->get_result();
        if ($row_f = $res_f->fetch_assoc()) {
            $file_to_delete = $row_f['files'];
        }
        $stmt_f->close();
    }

    // Hapus baris dari database
    $stmt_del = $connection->prepare("DELETE FROM uraian_kerja WHERE uraian_kerja_id = ?");
    if ($stmt_del) {
        $stmt_del->bind_param('i', $id);
        if ($stmt_del->execute()) {
            $stmt_del->close();

            // Unlink file foto fisik jika ada
            if (!empty($file_to_delete) && file_exists($upload_dir . $file_to_delete)) {
                @unlink($upload_dir . $file_to_delete);
            }

            http_response_code(200);
            echo json_encode(['status' => 'success', 'message' => 'Laporan kerja berhasil dihapus'], JSON_UNESCAPED_SLASHES);
            exit;
        }
        $stmt_del->close();
    }

    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Gagal menghapus data: ' . $connection->error], JSON_UNESCAPED_SLASHES);
    exit;
}

// Fallback jika metode HTTP tidak dikenali
http_response_code(405);
echo json_encode([
    'status' => 'error',
    'message' => 'Method Not Allowed'
], JSON_UNESCAPED_SLASHES);
exit;
