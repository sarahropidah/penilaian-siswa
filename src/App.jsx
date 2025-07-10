import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useNavigate } from "react-router-dom";

const defaultNilai = 80;
const plusPoint = 2;
const minusPoint = -2;

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function App() {
  const navigate = useNavigate(); // <-- Penting: HARUS di dalam komponen

  const [siswaList, setSiswaList] = useState(() => {
    const saved = localStorage.getItem("penilaianSiswa");
    return saved ? JSON.parse(saved) : {};
  });

  const [selectedDate, setSelectedDate] = useState(getToday());
  const [namaBaru, setNamaBaru] = useState("");
  const [siswaDipilih, setSiswaDipilih] = useState("");

  const allDates = Array.from(
    new Set(Object.values(siswaList).flatMap((s) => Object.keys(s)))
  ).sort((a, b) => new Date(b) - new Date(a));

  useEffect(() => {
    localStorage.setItem("penilaianSiswa", JSON.stringify(siswaList));
  }, [siswaList]);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    navigate("/login"); // <-- Pastikan routing /login udah didefinisikan
  };

  const tambahSiswa = () => {
    if (!namaBaru.trim()) return;
    setSiswaList((prev) => ({
      ...prev,
      [namaBaru.trim()]: {
        ...(prev[namaBaru.trim()] || {}),
        [selectedDate]: { plus: false, minus: false, total: defaultNilai },
      },
    }));
    setNamaBaru("");
  };

  const handleCheckbox = (nama, tipe) => {
    setSiswaList((prev) => {
      const current = prev[nama]?.[selectedDate] || {
        plus: false,
        minus: false,
        total: defaultNilai,
      };
      const newValue = { ...current, [tipe]: !current[tipe] };

      let nilai = defaultNilai;
      if (newValue.plus) nilai += plusPoint;
      if (newValue.minus) nilai += minusPoint;
      newValue.total = nilai;

      return {
        ...prev,
        [nama]: {
          ...(prev[nama] || {}),
          [selectedDate]: newValue,
        },
      };
    });
  };

  const hapusSiswa = (nama) => {
    const newList = { ...siswaList };
    delete newList[nama];
    setSiswaList(newList);
  };

  const exportToExcel = () => {
    const wsData = [["Nama", "Tanggal", "Aktif", "Melanggar", "Total Nilai"]];
    for (const nama in siswaList) {
      const tanggalData = siswaList[nama][selectedDate];
      if (tanggalData) {
        wsData.push([
          nama,
          selectedDate,
          tanggalData.plus ? "✓" : "",
          tanggalData.minus ? "✓" : "",
          tanggalData.total,
        ]);
      }
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "Penilaian");
    XLSX.writeFile(wb, `penilaian_${selectedDate}.xlsx`);
  };

  const semuaRiwayat = [];
  for (const nama in siswaList) {
    const tanggalData = siswaList[nama];
    for (const tanggal in tanggalData) {
      const data = tanggalData[tanggal];
      semuaRiwayat.push({
        nama,
        tanggal,
        plus: data.plus,
        minus: data.minus,
        total: data.total,
      });
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-white py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-2xl shadow-lg border">

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-3xl font-bold text-indigo-600">📋 Penilaian Siswa - {selectedDate}</h2>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded-lg text-sm"
          >
            Logout
          </button>
        </div>

        {/* Form Tambah Siswa */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <input
            type="text"
            placeholder="Nama siswa"
            value={namaBaru}
            onChange={(e) => setNamaBaru(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 w-full md:w-auto flex-1"
          />
          <button
            onClick={tambahSiswa}
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg transition"
          >
            ➕ Tambah
          </button>
          <button
            onClick={exportToExcel}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition"
          >
            📤 Export Excel
          </button>
        </div>

        {/* Pilih Tanggal */}
        <div className="mb-4">
          <label className="mr-2">📅 Tampilkan tanggal: </label>
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border px-2 py-1 rounded"
          >
            {allDates.map((date) => (
              <option key={date} value={date}>
                {date}
              </option>
            ))}
          </select>
        </div>

        {/* Pilih siswa untuk grafik */}
        <div className="mb-4">
          <label className="mr-2 text-indigo-700 font-semibold">📈 Lihat grafik siswa: </label>
          <select
            value={siswaDipilih}
            onChange={(e) => setSiswaDipilih(e.target.value)}
            className="border px-3 py-1 rounded"
          >
            <option value="">-- Pilih siswa --</option>
            {Object.keys(siswaList).map((nama) => (
              <option key={nama} value={nama}>
                {nama}
              </option>
            ))}
          </select>
        </div>

        {/* Tabel penilaian */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-center border rounded-xl overflow-hidden">
            <thead className="bg-indigo-500 text-white">
              <tr>
                <th className="px-4 py-2">Nama</th>
                <th className="px-4 py-2">Aktif (+2)</th>
                <th className="px-4 py-2">Melanggar (-2)</th>
                <th className="px-4 py-2">Total</th>
                <th className="px-4 py-2">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(siswaList).map(([nama, penilaian]) => {
                const dataHariIni = penilaian[selectedDate] || {
                  plus: false,
                  minus: false,
                  total: defaultNilai,
                };
                return (
                  <tr key={nama} className="odd:bg-white even:bg-gray-100 border-t border-gray-200">
                    <td className="px-4 py-2 font-medium">{nama}</td>
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={dataHariIni.plus}
                        onChange={() => handleCheckbox(nama, "plus")}
                        className="w-5 h-5 accent-green-600"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={dataHariIni.minus}
                        onChange={() => handleCheckbox(nama, "minus")}
                        className="w-5 h-5 accent-red-600"
                      />
                    </td>
                    <td className="px-4 py-2 font-semibold text-indigo-700">
                      {dataHariIni.total}
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => hapusSiswa(nama)}
                        className="text-red-500 hover:text-red-700 text-xl"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })}
              {Object.keys(siswaList).length === 0 && (
                <tr>
                  <td colSpan="5" className="py-6 text-gray-500 italic">
                    Belum ada siswa ditambahkan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Grafik */}
        {siswaDipilih && (
          <div className="mt-10">
            <h3 className="text-xl font-bold text-indigo-600 mb-4">
              📊 Grafik Nilai Harian - {siswaDipilih}
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={Object.entries(siswaList[siswaDipilih] || {}).map(
                  ([tanggal, data]) => ({
                    tanggal,
                    nilai: data.total,
                  })
                )}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="tanggal" />
                <YAxis domain={[70, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="nilai" stroke="#6366f1" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Riwayat Penilaian */}
        <div className="mt-10">
          <h3 className="text-2xl font-bold mb-4 text-indigo-600">📚 Riwayat Penilaian Harian</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-center border rounded-xl overflow-hidden">
              <thead className="bg-gray-700 text-white">
                <tr>
                  <th className="px-4 py-2">Nama</th>
                  <th className="px-4 py-2">Tanggal</th>
                  <th className="px-4 py-2">Aktif</th>
                  <th className="px-4 py-2">Melanggar</th>
                  <th className="px-4 py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {semuaRiwayat.length > 0 ? (
                  semuaRiwayat
                    .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
                    .map((item, i) => (
                      <tr
                        key={i}
                        className="odd:bg-white even:bg-gray-100 border-t border-gray-200"
                      >
                        <td className="px-4 py-2">{item.nama}</td>
                        <td className="px-4 py-2">{item.tanggal}</td>
                        <td className="px-4 py-2">{item.plus ? "✓" : ""}</td>
                        <td className="px-4 py-2">{item.minus ? "✓" : ""}</td>
                        <td className="px-4 py-2 font-medium">{item.total}</td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-4 text-gray-500 italic">
                      Belum ada riwayat penilaian.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;
