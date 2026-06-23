const Contact = require('../models/Contact');
const asyncHandler = require('../utils/asyncHandler');
const logActivity = require('../utils/logActivity');

const isManager = (user) => ['Owner', 'Admin', 'Manager'].includes(user.role);

// @route GET /api/contacts?type=customer|supplier&search=
exports.getContacts = asyncHandler(async (req, res) => {
  const query = { organization: req.user.organization };
  if (req.query.type) query.type = req.query.type;
  if (req.query.search) {
    const rx = new RegExp(req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [{ name: rx }, { email: rx }, { phone: rx }, { company: rx }];
  }
  const contacts = await Contact.find(query).sort({ name: 1 }).limit(500).lean();
  res.json(contacts);
});

// @route POST /api/contacts   (Owner/Admin/Manager)
exports.createContact = asyncHandler(async (req, res) => {
  if (!isManager(req.user)) {
    return res.status(403).json({ error: 'Not allowed to add contacts' });
  }
  const { type, name, email, phone, company, address, notes } = req.body;
  if (!['customer', 'supplier'].includes(type)) {
    return res.status(400).json({ error: 'type must be customer or supplier' });
  }
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }

  const contact = await Contact.create({
    organization: req.user.organization,
    type,
    name: name.trim(),
    email: email || '',
    phone: phone || '',
    company: company || '',
    address: address || '',
    notes: notes || '',
  });
  logActivity(req.user, 'contact.created', `added ${type} "${name}"`);
  res.status(201).json(contact);
});

// @route PUT /api/contacts/:id   (Owner/Admin/Manager)
exports.updateContact = asyncHandler(async (req, res) => {
  if (!isManager(req.user)) {
    return res.status(403).json({ error: 'Not allowed' });
  }
  const contact = await Contact.findOne({
    _id: req.params.id,
    organization: req.user.organization,
  });
  if (!contact) return res.status(404).json({ error: 'Contact not found' });

  ['name', 'email', 'phone', 'company', 'address', 'notes'].forEach((f) => {
    if (req.body[f] !== undefined) contact[f] = req.body[f];
  });
  await contact.save();
  res.json(contact);
});

// @route DELETE /api/contacts/:id   (Owner/Admin/Manager)
exports.deleteContact = asyncHandler(async (req, res) => {
  if (!isManager(req.user)) {
    return res.status(403).json({ error: 'Not allowed' });
  }
  const contact = await Contact.findOneAndDelete({
    _id: req.params.id,
    organization: req.user.organization,
  });
  if (!contact) return res.status(404).json({ error: 'Contact not found' });
  res.json({ message: 'Contact deleted' });
});
