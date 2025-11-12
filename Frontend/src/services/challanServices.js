export const getChallanStats = async () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const res = await fetch('http://localhost:5001/api/challan/stats', {
    headers: { Authorization: token ? `Bearer ${token}` : '' }
  });
  if (!res.ok) throw new Error('Failed to fetch challan stats');
  const json = await res.json();
  return { data: json };
};
